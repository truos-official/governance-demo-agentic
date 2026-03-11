import time
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from src.rag_chain import build_chain
from src.topic_classifier import detect_style
from src.security import run_security_checks, anonymize_pii
from src.hallucination_detector import detect_hallucination
from src.metrics_tracker import track_query, track_security_event, get_metrics, get_security_events

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

def is_meta_question(query: str) -> bool:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = f"""Does this query EXPLICITLY ask about THIS AI assistant itself — its identity, creation, capabilities, or how it works as a system?

Answer YES only if the user is directly asking about this AI tool — not about AI in general, not about AI governance, not about external systems.

Examples of YES: "what are you", "what can you do", "who built you", "when were you created", "what are your capabilities", "how do you work", "what is this tool"
Examples of NO: "what are AI governance principles", "what are sources of AI knowledge in the UN", "how does AI work in military contexts", "what risks does AI pose"

Answer only YES or NO.
Query: {query}"""
    return llm.invoke(prompt).content.strip().upper() == "YES"

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

@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    if is_meta_question(request.question):
        return QueryResponse(
            answer=answer_meta_question(request.question),
            hallucination_score={"is_hallucination": False, "confidence": 1.0, "reason": "System capability response"},
            detected_style="factual",
            sources=[]
        )

    start_time = time.time()
    security = run_security_checks(request.question, request.user_id)

    if not security["passed"]:
        if security["injection_detected"]:
            track_security_event("injection")
        if not security["rate_limit_ok"]:
            track_security_event("rate_limit")
        raise HTTPException(status_code=400, detail=security)

    if security["pii_detected"]:
        track_security_event("pii")

    clean_query = anonymize_pii(request.question)
    prompt_type = detect_style(clean_query)
    chain = build_chain(prompt_type=prompt_type, topic="AI Governance")
    result = chain(clean_query)

    hallucination = detect_hallucination(
        question=clean_query,
        answer=result["answer"],
        context=result["context"]
    )

    latency = time.time() - start_time
    track_query(
        style=prompt_type,
        sources=result.get("sources", []),
        is_hallucination=hallucination["is_hallucination"],
        cache_hit=result.get("cache_hit", False),
        pii_detected=security["pii_detected"],
        latency=latency
    )

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