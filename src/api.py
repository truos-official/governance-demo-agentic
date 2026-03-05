from fastapi import FastAPI
from pydantic import BaseModel
from src.rag_chain import build_chain

app = FastAPI()
chain = build_chain()

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    answer = chain(request.question)
    return QueryResponse(answer=answer)