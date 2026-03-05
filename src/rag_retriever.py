from pathlib import Path
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

CHROMA_DIR = Path("data/chroma_db")

def load_vector_store():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    db = Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings
    )
    return db

def retrieve(query: str, k: int = 3):
    db = load_vector_store()
    results = db.similarity_search(query, k=k)
    for i, doc in enumerate(results):
        print(f"\n--- Result {i+1} ---")
        print(f"Source: {doc.metadata.get('source', 'unknown')}")
        print(f"Content: {doc.page_content[:300]}")

if __name__ == "__main__":
    retrieve("AI governance principles for member states")