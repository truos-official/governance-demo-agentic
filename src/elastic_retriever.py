from pathlib import Path
from dotenv import load_dotenv
from os import getenv
from elasticsearch import Elasticsearch
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()
INDEX_NAME="un_documents_index"

def connect():
    client=Elasticsearch(getenv("ELASTIC_ENDPOINT"), api_key=getenv("ELASTIC_API_KEY"))
    print(f'Connected to elasticSearch client:{client}')
    return client

def keyword_search(client, query, top_k=5):
    response = client.search(
        index=INDEX_NAME,
        body={
            "query": {
                "match": {
                    "content": query
                }
            },
            "size": top_k
        }
    )
    return response['hits']['hits']

def vector_search(client, query, top_k=5):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2")
    query_vector = embeddings.embed_query(query)

    response = client.search(
        index=INDEX_NAME,
        body={
            "knn": {
                "field": "embedding",
                "query_vector": query_vector,
                "k": top_k,
                "num_candidates": 100
            }
        }
    )
    return response['hits']['hits']

def hybrid_search(client, query, top_k=5):
    keyword_results = keyword_search(client, query, top_k=top_k*2)
    vector_results = vector_search(client, query, top_k=top_k*2)

    # Combine and deduplicate results
    combined_results = {res['_id']: res for res in keyword_results + vector_results}
    
    # Sort by relevance (you can implement a more sophisticated scoring mechanism here)
    sorted_results = sorted(combined_results.values(), key=lambda x: x['_score'], reverse=True)
    
    return sorted_results[:top_k]

if __name__ == "__main__":
    client = connect()
    query = "AI governance principles for developing nations"
    print("\n--- Hybrid Search Results ---")
    results = hybrid_search(client, query)
    for r in results:
        print(f"\nSource: {r['_source']['source']}")
        print(f"Score: {r['_score']}")
        print(f"Content: {r['_source']['content'][:200]}")