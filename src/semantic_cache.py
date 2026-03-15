import json
import os
import numpy as np
import redis
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

load_dotenv()

SIMILARITY_THRESHOLD = 0.95
CACHE_TTL = 3600

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

def get_redis_client():
    return redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=False,
        decode_responses=True
    )

def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def get_cached_response(query: str, prompt_type: str = "factual", topic: str = "AI Governance") -> str | None:
    client = get_redis_client()
    query_vector = embeddings.embed_query(query)
    for key in client.scan_iter("cache:*"):
        cached = json.loads(client.get(key))
        if cached.get("prompt_type") != prompt_type or cached.get("topic") != topic:
            continue
        if cosine_similarity(query_vector, cached["vector"]) >= SIMILARITY_THRESHOLD:
            return cached["answer"]
    return None

def store_in_cache(query: str, answer: str, prompt_type: str = "factual", topic: str = "AI Governance"):
    client = get_redis_client()
    query_vector = embeddings.embed_query(query)
    key = f"cache:{hash(query + prompt_type + topic)}"
    client.setex(key, CACHE_TTL, json.dumps({
        "query": query,
        "answer": answer,
        "prompt_type": prompt_type,
        "topic": topic,
        "vector": query_vector
    }))