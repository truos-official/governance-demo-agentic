import json
import os
import time
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from src.rag_chain import build_chain
from src.query_classifier import classify_query
from src.security import run_security_checks, anonymize_pii
from src.hallucination_detector import detect_hallucination
from src.metrics_tracker import (
    track_query, track_security_event, get_metrics, get_security_events,
    get_redis_client, track_user_query, get_user_metrics
)

load_dotenv()

app = FastAPI()

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
            track_security_event("injection")
        if not security["rate_limit_ok"]:
            track_security_event("rate_limit")
        raise HTTPException(status_code=400, detail=security)

    if security["pii_detected"]:
        track_security_event("pii")

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
        print(f"Metrics tracking error (non-fatal): {e}")

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
        raise HTTPException(status_code=500, detail=f"Cache clear failed: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Metrics reset failed: {str(e)}")

@app.post("/register")
def register(request: RegisterRequest):
    try:
        client = get_redis_client()
        profile = {
            "user_id": request.user_id,
            "provider": request.provider,
            "full_name": request.full_name,
            "email": request.email,
            "title": request.title,
            "company": request.company,
            "country": request.country,
            "registered_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat()
        }
        client.set(f"user:{request.user_id}:profile", json.dumps(profile))
        client.sadd("users:all", request.user_id)
        return {"status": "registered", "profile": profile}
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.get("/health")
def health():
    """Health check endpoint for Azure Container Apps."""
    checks = {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
    try:
        client = get_redis_client()
        client.ping()
        checks["redis"] = "connected"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        checks["status"] = "degraded"
    return checks

@app.get("/user-profile/{user_id}")
def get_user_profile(user_id: str):
    client = get_redis_client()
    raw = client.get(f"user:{user_id}:profile")
    if not raw:
        return {"profile": None}
    return {"profile": json.loads(raw)}

@app.get("/users")
def get_all_users():
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
