import json
import os
import numpy as np
import redis
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

SIMILARITY_THRESHOLD = 0.95
CACHE_TTL = 3600  # 1 hour

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def get_redis_client():
    return redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=True,
        decode_responses=True
    )

def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def get_cached_response(query: str) -> str | None:
    client = get_redis_client()
    query_vector = embeddings.embed_query(query)
    
    for key in client.scan_iter("cache:*"):
        cached = json.loads(client.get(key))
        similarity = cosine_similarity(query_vector, cached["vector"])
        if similarity >= SIMILARITY_THRESHOLD:
            print(f"Cache hit — similarity: {similarity:.3f}")
            return cached["answer"]
    return None

def store_in_cache(query: str, answer: str):
    client = get_redis_client()
    query_vector = embeddings.embed_query(query)
    key = f"cache:{hash(query)}"
    client.setex(key, CACHE_TTL, json.dumps({
        "query": query,
        "answer": answer,
        "vector": query_vector
    }))
    print(f"Stored in cache: {key}")