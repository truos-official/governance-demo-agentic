import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from src.elastic_retriever import connect, hybrid_search
from src.prompt_library import get_prompt
from src.semantic_cache import get_cached_response, store_in_cache

load_dotenv()

TITLES_FILE = Path("data/document_titles.json")

def load_document_titles() -> dict:
    with open(TITLES_FILE, encoding="utf-8") as f:
        return json.load(f)

def is_valid_answer(answer: str, context: str) -> bool:
    if not answer or len(answer.strip()) < 20:
        return False
    if answer.strip() == context.strip():
        return False
    overlap = sum(1 for chunk in context.split("\n\n") if chunk.strip() in answer)
    return overlap < 2

def build_chain(prompt_type: str = "factual", topic: str = "AI Governance"):
    llm = ChatOpenAI(model="ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8", temperature=0)
    fallback_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = get_prompt(prompt_type)
    client = connect()
    titles = load_document_titles()

    def chain(query: str) -> dict:
        cached = get_cached_response(query, prompt_type, topic)
        if cached:
            return {"answer": cached, "context": "cached", "cache_hit": True, "sources": []}

        results = hybrid_search(client, query)
        context = "\n\n".join([r['_source']['content'] for r in results])
        formatted_prompt = prompt.format(context=context, question=query, topic=topic)
        response = llm.invoke(formatted_prompt)
        answer = response.content

        if not is_valid_answer(answer, context):
            response = fallback_llm.invoke(formatted_prompt)
            answer = response.content

        store_in_cache(query, answer, prompt_type, topic)

        sources = list(set([
            titles.get(r['_source']['source'].split("\\")[-1].replace(".txt", ""), None)
            for r in results
        ]))
        sources = [s for s in sources if s is not None]

        return {"answer": answer, "context": context, "cache_hit": False, "sources": sources}

    return chain