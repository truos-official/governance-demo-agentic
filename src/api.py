from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from src.rag_chain import build_chain
from src.topic_classifier import detect_style
from src.security import run_security_checks, anonymize_pii
from src.hallucination_detector import detect_hallucination

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    user_id: str = "anonymous"

class QueryResponse(BaseModel):
    answer: str
    hallucination_score: dict
    detected_style: str
    sources: list

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    security = run_security_checks(request.question, request.user_id)
    if not security["passed"]:
        raise HTTPException(status_code=400, detail=security)

    clean_query = anonymize_pii(request.question)
    prompt_type = detect_style(clean_query)
    chain = build_chain(prompt_type=prompt_type, topic="AI Governance")
    result = chain(clean_query)

    hallucination = detect_hallucination(
        question=clean_query,
        answer=result["answer"],
        context=result["context"]
    )

    return QueryResponse(
        answer=result["answer"],
        hallucination_score=hallucination,
        detected_style=prompt_type,
        sources=result.get("sources", [])
    )