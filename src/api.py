import time
import json
import logging
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from os import getenv
from src.rag_chain import build_chain
from src.query_classifier import classify_query
from src.security import run_security_checks, anonymize_pii
from src.hallucination_detector import detect_hallucination
from src.metrics_tracker import (
    track_query, track_security_event, get_metrics, get_security_events,
    get_redis_client, track_user_query, get_user_metrics, get_all_user_activity
)

load_dotenv()

logger = logging.getLogger("uvicorn")

app = FastAPI()

cors_origins = getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_CONTEXT = """You are an AI Governance Assistant built for the UN Secretariat — OICT.
You were created in 2025 as a demonstration system for responsible AI governance.
You are powered by a fine-tuned GPT-4o-mini model trained on 9 UN governance documents.
Document sources: A/80/78, A/RES/78/265, E/C.16/2025/4, A/79/L.94, A/79/966, CEB/2020/6/Add.1, GE.25-06864, GE.25-07365, IPBES/12/INF/12.
You cover AI policy, human rights, military AI, biodiversity, sustainable development, and public sector AI governance.
You auto-detect query intent, anonymize PII, detect hallucinations, and refuse adversarial queries.
You supplement UN document knowledge with general knowledge on AI governance and UN/EU policy when needed."""

ADMIN_EMAIL = getenv("ADMIN_EMAIL", "tristan.gitman@un.org").strip().lower()

def answer_meta_question(query: str) -> str:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = f"""You are an AI assistant. Answer this question about yourself using only the context below.
Be concise and direct. Do not repeat information not relevant to the question.

System context:
{SYSTEM_CONTEXT}

Question: {query}"""
    return llm.invoke(prompt).content.strip()

class QueryRequest(BaseModel):
    question: str
    user_id: str = "anonymous"

class QueryResponse(BaseModel):
    answer: str
    hallucination_score: dict
    detected_style: str
    sources: list

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

@app.get("/health")
def health():
    try:
        client = get_redis_client()
        client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "degraded", "redis": str(e)}

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    start_time = time.time()
    classification = classify_query(request.question)

    if classification["is_meta"]:
        return QueryResponse(
            answer=answer_meta_question(request.question),
            hallucination_score={"is_hallucination": False, "confidence": 1.0, "reason": "System capability response"},
            detected_style="factual",
            sources=[]
        )

    security = run_security_checks(request.question, request.user_id, classification["is_injection"])

    if not security["passed"]:
        if security["injection_detected"]:
            try: track_security_event("injection")
            except: pass
        if not security["rate_limit_ok"]:
            try: track_security_event("rate_limit")
            except: pass
        raise HTTPException(status_code=400, detail=security)

    if security["pii_detected"]:
        try: track_security_event("pii")
        except: pass

    clean_query = anonymize_pii(request.question)
    prompt_type = classification["style"]
    chain = build_chain(prompt_type=prompt_type, topic="AI Governance")
    result = chain(clean_query)

    hallucination = detect_hallucination(
        question=clean_query,
        answer=result["answer"],
        context=result["context"]
    )

    latency = time.time() - start_time

    try:
        track_query(
            style=prompt_type,
            sources=result.get("sources", []),
            is_hallucination=hallucination["is_hallucination"],
            cache_hit=result.get("cache_hit", False),
            pii_detected=security["pii_detected"],
            latency=latency
        )
        track_user_query(
            user_id=request.user_id,
            style=prompt_type,
            is_hallucination=hallucination["is_hallucination"],
            latency=latency
        )
    except Exception as e:
        logger.warning(f"Metrics tracking failed (non-fatal): {e}")

    return QueryResponse(
        answer=result["answer"],
        hallucination_score=hallucination,
        detected_style=prompt_type,
        sources=result.get("sources", [])
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
        deleted = 0
        for key in client.scan_iter("cache:*"):
            client.delete(key)
            deleted += 1
        return {"cleared": deleted, "message": f"Cleared {deleted} cache entries"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset-metrics")
def reset_metrics():
    try:
        client = get_redis_client()
        deleted = 0
        for key in client.scan_iter("metrics:*"):
            client.delete(key)
            deleted += 1
        for key in client.scan_iter("security:*"):
            client.delete(key)
            deleted += 1
        return {"cleared": deleted, "message": f"Reset {deleted} metric keys"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register")
def register(request: RegisterRequest):
    try:
        client = get_redis_client()
        is_admin = request.email.strip().lower() == ADMIN_EMAIL
        status = "approved" if is_admin else "pending"
        profile = {
            "user_id": request.user_id,
            "provider": request.provider,
            "full_name": request.full_name,
            "email": request.email.strip().lower(),
            "title": request.title,
            "company": request.company,
            "country": request.country,
            "registered_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat(),
            "status": status
        }
        client.set(f"user:{request.user_id}:profile", json.dumps(profile))
        client.sadd("users:all", request.user_id)
        if is_admin:
            client.sadd("users:approved", request.user_id)
        else:
            client.sadd("users:pending", request.user_id)
        logger.info(f"NEW_USER_REGISTERED: {json.dumps(profile)}")
        return {"status": "registered", "profile": profile}
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.get("/user-profile/{user_id}")
def get_user_profile(user_id: str):
    try:
        client = get_redis_client()
        raw = client.get(f"user:{user_id}:profile")
        if not raw:
            return {"profile": None}
        return {"profile": json.loads(raw)}
    except Exception as e:
        return {"profile": None}

@app.get("/users")
def get_all_users():
    try:
        client = get_redis_client()
        user_ids = client.smembers("users:all")
        users = []
        for uid in user_ids:
            raw = client.get(f"user:{uid}:profile")
            if raw:
                profile = json.loads(raw)
                user_metrics = get_user_metrics(uid)
                users.append({**profile, **user_metrics})
        return {"users": users, "total": len(users)}
    except Exception as e:
        return {"users": [], "total": 0}
    
@app.post("/auth/approve")
def approve_user(user_id: str, approved_by: str = "admin"):
    try:
        client = get_redis_client()
        raw = client.get(f"user:{user_id}:profile")
        if not raw:
            raise HTTPException(status_code=404, detail="User not found")
        profile = json.loads(raw)
        profile["status"] = "approved"
        profile["approved_by"] = approved_by
        profile["approved_at"] = datetime.utcnow().isoformat()
        client.set(f"user:{user_id}:profile", json.dumps(profile))
        client.sadd("users:approved", user_id)
        client.srem("users:pending", user_id)
        logger.info(f"USER_APPROVED: {user_id} by {approved_by}")
        return {"status": "approved", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/revoke")
def revoke_user(user_id: str, revoked_by: str = "admin"):
    try:
        client = get_redis_client()
        raw = client.get(f"user:{user_id}:profile")
        if not raw:
            raise HTTPException(status_code=404, detail="User not found")
        profile = json.loads(raw)
        profile["status"] = "revoked"
        profile["revoked_by"] = revoked_by
        profile["revoked_at"] = datetime.utcnow().isoformat()
        client.set(f"user:{user_id}:profile", json.dumps(profile))
        client.srem("users:approved", user_id)
        client.srem("users:pending", user_id)
        client.sadd("users:revoked", user_id)
        logger.info(f"USER_REVOKED: {user_id} by {revoked_by}")
        return {"status": "revoked", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/validate/{user_id}")
def validate_user(user_id: str, email: str = ""):
    try:
        client = get_redis_client()
        raw = client.get(f"user:{user_id}:profile")

        if not raw and email:
            all_ids = client.smembers("users:all")
            for uid in all_ids:
                candidate = client.get(f"user:{uid}:profile")
                if candidate:
                    p = json.loads(candidate)
                    if p.get("email", "").lower() == email.lower():
                        raw = candidate
                        break

        if not raw:
            return {"status": "unregistered"}
        profile = json.loads(raw)
        status = profile.get("status", "pending")
        return {"status": status, "profile": profile}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

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
    except Exception as e:
        return {"status": "error", "detail": str(e)}

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
            "submitted_at": datetime.utcnow().isoformat()
        }
        client.set(f"feedback:{request.query_id}", json.dumps(feedback))
        client.sadd("feedback:all", request.query_id)
        if request.rating < 0:
            client.sadd("feedback:negative", request.query_id)
            client.srem("feedback:positive", request.query_id)
        else:
            client.sadd("feedback:positive", request.query_id)
            client.srem("feedback:negative", request.query_id)
        client.incr(f"metrics:feedback:{'positive' if request.rating == 1 else 'negative'}")
        logger.info(f"FEEDBACK: query_id={request.query_id} rating={request.rating} user={request.user_id}")
        return {"status": "recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feedback/export")
def export_feedback():
    try:
        client = get_redis_client()
        query_ids = client.smembers("feedback:all")
        feedback_list = []
        for qid in query_ids:
            raw = client.get(f"feedback:{qid}")
            if raw:
                feedback_list.append(json.loads(raw))
        feedback_list.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
        return {"feedback": feedback_list, "total": len(feedback_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feedback/finetune-export")
def export_finetune():
    try:
        client = get_redis_client()
        positive_ids = client.smembers("feedback:positive")
        jsonl_lines = []
        for qid in positive_ids:
            raw = client.get(f"feedback:{qid}")
            if raw:
                fb = json.loads(raw)
                line = {
                    "messages": [
                        {"role": "system", "content": "You are an AI Governance Assistant for the UN Secretariat."},
                        {"role": "user", "content": fb["question"]},
                        {"role": "assistant", "content": fb["answer"]}
                    ]
                }
                jsonl_lines.append(json.dumps(line))
        return {"jsonl": "\n".join(jsonl_lines), "total": len(jsonl_lines)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
