from fastapi import FastAPI
from pydantic import BaseModel
from src.rag_chain import build_chain
from src.topic_classifier import load_topics, classify_query

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    prompt_type: str="factual"  # "factual" or "opinion"
    topic: str="AI Governance"  # "AI Governance", "AI Ethics", "AI Safety", "AI Policy"

class QueryResponse(BaseModel):
    answer: str

class ClassifyRequest(BaseModel):
    question: str

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    chain = build_chain(prompt_type=request.prompt_type, topic=request.topic)
    answer = chain(request.question)
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