from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from src.elastic_retriever import connect, hybrid_search
from src.prompt_library import get_prompt
from src.semantic_cache import get_cached_response, store_in_cache

load_dotenv()

def build_chain(prompt_type: str = "factual", topic: str = "AI Governance"):
    llm = ChatOpenAI(model="ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8", temperature=0)
    prompt = get_prompt(prompt_type)
    client = connect()

    def chain(query: str) -> dict:
        cached = get_cached_response(query)
        if cached:
            return {"answer": cached, "context": "cached", "cache_hit": True}
        
        results = hybrid_search(client, query)
        context = "\n\n".join([r['_source']['content'] for r in results])
        formatted_prompt = prompt.format(context=context, question=query, topic=topic)
        response = llm.invoke(formatted_prompt)
        store_in_cache(query, response.content)
        return {"answer": response.content, "context": context, "cache_hit": False}

    return chain