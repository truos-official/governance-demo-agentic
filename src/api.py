import json
import logging
import time
from datetime import datetime
from os import getenv
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.hallucination_detector import detect_hallucination
from src.metrics_tracker import (
    get_metrics,
    get_redis_client,
    get_security_events,
    get_user_metrics,
    track_query,
    track_security_event,
    track_user_query,
)
from src.query_classifier import classify_query
from src.rag_chain import build_chain
from src.security import anonymize_pii, run_security_checks

load_dotenv()

logger = logging.getLogger("uvicorn")

app = FastAPI()

cors_origins = [origin.strip() for origin in getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_CONTEXT = """You are an AI Governance Assistant built for the UN Secretariat - OICT.
You were created in 2025 as a demonstration system for responsible AI governance.
You are powered by a fine-tuned GPT-4o-mini model trained on 9 UN governance documents.
Document sources: A/80/78, A/RES/78/265, E/C.16/2025/4, A/79/L.94, A/79/966, CEB/2020/6/Add.1, GE.25-06864, GE.25-07365, IPBES/12/INF/12.
You cover AI policy, human rights, military AI, biodiversity, sustainable development, and public sector AI governance.
You auto-detect query intent, anonymize PII, detect hallucinations, and refuse adversarial queries.
You supplement UN document knowledge with general knowledge on AI governance and UN/EU policy when needed."""

ADMIN_EMAIL = getenv("ADMIN_EMAIL", "tristan.gitman@un.org").strip().lower()


class QueryRequest(BaseModel):
    question: str
    user_id: str = "anonymous"


class QueryResponse(BaseModel):
    answer: str
    hallucination_score: dict[str, Any]
    detected_style: str
    sources: list[str]


class RegisterRequest(BaseModel):
    user_id: str
    provider: str
    full_name: str
    email: str
    title: str
    company: str
    country: str


class FeedbackRequest(BaseModel):
    query_id: str
    question: str
    answer: str
    rating: int = Field(..., ge=-1, le=1)
    user_id: str = "anonymous"
    comment: str = ""


def utcnow_iso() -> str:
    return datetime.utcnow().isoformat()


def answer_meta_question(query: str) -> str:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = f"""You are an AI assistant. Answer this question about yourself using only the context below.
Be concise and direct. Do not repeat information not relevant to the question.

System context:
{SYSTEM_CONTEXT}

Question: {query}"""
    return llm.invoke(prompt).content.strip()


def load_user_profile(client: Any, user_id: str) -> dict[str, Any] | None:
    raw = client.get(f"user:{user_id}:profile")
    if not raw:
        return None
    return json.loads(raw)


def save_user_profile(client: Any, user_id: str, profile: dict[str, Any]) -> None:
    client.set(f"user:{user_id}:profile", json.dumps(profile))


def update_user_status_sets(client: Any, user_id: str, status: str) -> None:
    client.sadd("users:all", user_id)
    client.srem("users:approved", user_id)
    client.srem("users:pending", user_id)
    client.srem("users:revoked", user_id)
    client.sadd(f"users:{status}", user_id)


def track_security_event_safely(event_name: str) -> None:
    try:
        track_security_event(event_name)
    except Exception as exc:
        logger.warning("Security event tracking failed for %s: %s", event_name, exc)


def delete_keys(client: Any, pattern: str) -> int:
    deleted = 0
    for key in client.scan_iter(pattern):
        client.delete(key)
        deleted += 1
    return deleted


@app.get("/health")
def health():
    try:
        client = get_redis_client()
        client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as exc:
        logger.warning("Health check degraded: %s", exc)
        return {"status": "degraded", "redis": str(exc)}


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    start_time = time.time()
    classification = classify_query(request.question)

    if classification["is_meta"]:
        return QueryResponse(
            answer=answer_meta_question(request.question),
            hallucination_score={
                "is_hallucination": False,
                "confidence": 1.0,
                "reason": "System capability response",
            },
            detected_style="factual",
            sources=[],
        )

    security = run_security_checks(request.question, request.user_id, classification["is_injection"])

    if not security["passed"]:
        if security["injection_detected"]:
            track_security_event_safely("injection")
        if not security["rate_limit_ok"]:
            track_security_event_safely("rate_limit")
        raise HTTPException(status_code=400, detail=security)

    if security["pii_detected"]:
        track_security_event_safely("pii")

    clean_query = anonymize_pii(request.question)
    prompt_type = classification["style"]
    chain = build_chain(prompt_type=prompt_type, topic="AI Governance")
    result = chain(clean_query)

    hallucination = detect_hallucination(
        question=clean_query,
        answer=result["answer"],
        context=result["context"],
    )

    latency = time.time() - start_time

    try:
        track_query(
            style=prompt_type,
            sources=result.get("sources", []),
            is_hallucination=hallucination["is_hallucination"],
            cache_hit=result.get("cache_hit", False),
            pii_detected=security["pii_detected"],
            latency=latency,
        )
        track_user_query(
            user_id=request.user_id,
            style=prompt_type,
            is_hallucination=hallucination["is_hallucination"],
            latency=latency,
        )
    except Exception as exc:
        logger.warning("Metrics tracking failed (non-fatal): %s", exc)

    return QueryResponse(
        answer=result["answer"],
        hallucination_score=hallucination,
        detected_style=prompt_type,
        sources=result.get("sources", []),
    )


@app.get("/metrics")
def metrics():
    return get_metrics()


@app.get("/security-events")
def security_events():
    return get_security_events()


@app.post("/clear-cache")
def clear_cache():
    try:
        client = get_redis_client()
        deleted = delete_keys(client, "cache:*")
        return {"cleared": deleted, "message": f"Cleared {deleted} cache entries"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/reset-metrics")
def reset_metrics():
    try:
        client = get_redis_client()
        deleted = delete_keys(client, "metrics:*")
        deleted += delete_keys(client, "security:*")
        return {"cleared": deleted, "message": f"Reset {deleted} metric keys"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/register")
def register(request: RegisterRequest):
    try:
        client = get_redis_client()
        normalized_email = request.email.strip().lower()
        status = "approved" if normalized_email == ADMIN_EMAIL else "pending"
        profile = {
            "user_id": request.user_id,
            "provider": request.provider,
            "full_name": request.full_name.strip(),
            "email": normalized_email,
            "title": request.title.strip(),
            "company": request.company.strip(),
            "country": request.country.strip(),
            "registered_at": utcnow_iso(),
            "last_active": utcnow_iso(),
            "status": status,
        }
        save_user_profile(client, request.user_id, profile)
        update_user_status_sets(client, request.user_id, status)
        logger.info("NEW_USER_REGISTERED: %s", json.dumps(profile))
        return {"status": "registered", "profile": profile}
    except Exception as exc:
        logger.error("Registration failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Registration failed: {exc}") from exc


@app.get("/user-profile/{user_id}")
def get_user_profile(user_id: str):
    try:
        client = get_redis_client()
        profile = load_user_profile(client, user_id)
        return {"profile": profile}
    except Exception as exc:
        logger.warning("User profile lookup failed for %s: %s", user_id, exc)
        return {"profile": None}


@app.get("/users")
def get_all_users():
    try:
        client = get_redis_client()
        user_ids = sorted(client.smembers("users:all"))
        users = []
        for user_id in user_ids:
            profile = load_user_profile(client, user_id)
            if profile:
                users.append({**profile, **get_user_metrics(user_id)})
        return {"users": users, "total": len(users)}
    except Exception as exc:
        logger.warning("User listing failed: %s", exc)
        return {"users": [], "total": 0}


@app.post("/auth/approve")
def approve_user(user_id: str, approved_by: str = "admin"):
    try:
        client = get_redis_client()
        profile = load_user_profile(client, user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User not found")
        profile["status"] = "approved"
        profile["approved_by"] = approved_by
        profile["approved_at"] = utcnow_iso()
        save_user_profile(client, user_id, profile)
        update_user_status_sets(client, user_id, "approved")
        logger.info("USER_APPROVED: %s by %s", user_id, approved_by)
        return {"status": "approved", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/auth/revoke")
def revoke_user(user_id: str, revoked_by: str = "admin"):
    try:
        client = get_redis_client()
        profile = load_user_profile(client, user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User not found")
        profile["status"] = "revoked"
        profile["revoked_by"] = revoked_by
        profile["revoked_at"] = utcnow_iso()
        save_user_profile(client, user_id, profile)
        update_user_status_sets(client, user_id, "revoked")
        logger.info("USER_REVOKED: %s by %s", user_id, revoked_by)
        return {"status": "revoked", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/auth/validate/{user_id}")
def validate_user(user_id: str):
    try:
        client = get_redis_client()
        profile = load_user_profile(client, user_id)
        if not profile:
            return {"status": "unregistered"}
        return {"status": profile.get("status", "pending"), "profile": profile}
    except Exception as exc:
        logger.warning("User validation failed for %s: %s", user_id, exc)
        return {"status": "error", "detail": str(exc)}


@app.post("/auth/logout-dev")
def logout_dev(user_id: str):
    try:
        client = get_redis_client()
        client.delete(f"user:{user_id}:profile")
        client.srem("users:all", user_id)
        client.srem("users:approved", user_id)
        client.srem("users:pending", user_id)
        client.srem("users:revoked", user_id)
        return {"status": "logged_out"}
    except Exception as exc:
        logger.warning("Dev logout failed for %s: %s", user_id, exc)
        return {"status": "error", "detail": str(exc)}


@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    try:
        client = get_redis_client()
        feedback = {
            "query_id": request.query_id,
            "question": request.question,
            "answer": request.answer,
            "rating": request.rating,
            "user_id": request.user_id,
            "comment": request.comment,
            "submitted_at": utcnow_iso(),
        }
        client.set(f"feedback:{request.query_id}", json.dumps(feedback))
        client.sadd("feedback:all", request.query_id)
        if request.rating < 0:
            client.sadd("feedback:negative", request.query_id)
            client.srem("feedback:positive", request.query_id)
            metric_name = "negative"
        else:
            client.sadd("feedback:positive", request.query_id)
            client.srem("feedback:negative", request.query_id)
            metric_name = "positive"
        client.incr(f"metrics:feedback:{metric_name}")
        logger.info(
            "FEEDBACK: query_id=%s rating=%s user=%s",
            request.query_id,
            request.rating,
            request.user_id,
        )
        return {"status": "recorded"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/feedback/export")
def export_feedback():
    try:
        client = get_redis_client()
        query_ids = client.smembers("feedback:all")
        feedback_list = []
        for query_id in query_ids:
            raw = client.get(f"feedback:{query_id}")
            if raw:
                feedback_list.append(json.loads(raw))
        feedback_list.sort(key=lambda item: item.get("submitted_at", ""), reverse=True)
        return {"feedback": feedback_list, "total": len(feedback_list)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/feedback/finetune-export")
def export_finetune():
    try:
        client = get_redis_client()
        positive_ids = client.smembers("feedback:positive")
        jsonl_lines = []
        for query_id in positive_ids:
            raw = client.get(f"feedback:{query_id}")
            if not raw:
                continue
            feedback = json.loads(raw)
            line = {
                "messages": [
                    {"role": "system", "content": "You are an AI Governance Assistant for the UN Secretariat."},
                    {"role": "user", "content": feedback["question"]},
                    {"role": "assistant", "content": feedback["answer"]},
                ]
            }
            jsonl_lines.append(json.dumps(line))
        return {"jsonl": "\n".join(jsonl_lines), "total": len(jsonl_lines)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
