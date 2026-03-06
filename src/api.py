from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from src.rag_chain import build_chain
from src.topic_classifier import load_topics, classify_query
from src.security import run_security_checks, anonymize_pii
from src.hallucination_detector import detect_hallucination

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    prompt_type: str = "factual"
    topic: str = "AI Governance"
    user_id: str = "anonymous"

class QueryResponse(BaseModel):
    answer: str
    hallucination_score: dict

class ClassifyRequest(BaseModel):
    question: str

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    security = run_security_checks(request.question, request.user_id)
    if not security["passed"]:
        raise HTTPException(status_code=400, detail=security)
    
    clean_query = anonymize_pii(request.question)
    chain = build_chain(prompt_type=request.prompt_type, topic=request.topic)
    result = chain(clean_query)
    
    hallucination = detect_hallucination(
        question=clean_query,
        answer=result["answer"],
        context=result["context"]
    )
    
    return QueryResponse(answer=result["answer"], hallucination_score=hallucination)

@app.get("/topics")
def get_topics():
    return {"topics": load_topics()}

@app.post("/classify")
def classify(request: ClassifyRequest):
    topics = load_topics()
    results = classify_query(request.question, topics)
    return {"topics": results}