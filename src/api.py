from pydantic import BaseModel
from src.rag_chain import build_chain
from src.topic_classifier import load_topics, classify_query
from src.security import run_security_checks
from fastapi import FastAPI, HTTPException
from src.security import run_security_checks, anonymize_pii

app = FastAPI()

class QueryResponse(BaseModel):
    answer: str

class ClassifyRequest(BaseModel):
    question: str

class QueryRequest(BaseModel):
    question: str
    prompt_type: str = "factual"
    topic: str = "AI Governance"
    user_id: str = "anonymous"

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    security = run_security_checks(request.question, request.user_id)
    if not security["passed"]:
        raise HTTPException(status_code=400, detail=security)
    
    clean_query = anonymize_pii(request.question)
    
    chain = build_chain(prompt_type=request.prompt_type, topic=request.topic)
    answer = chain(clean_query)
    return QueryResponse(answer=answer)

@app.get("/topics")
def get_topics():    
    topics = load_topics()
    return {"topics": topics}

@app.post("/classify")
def classify(request: ClassifyRequest):
    topics = load_topics()
    results = classify_query(request.question, topics)
    return {"topics": results}