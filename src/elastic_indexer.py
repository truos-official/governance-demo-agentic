from pathlib import Path
from dotenv import load_dotenv
from os import getenv
import re
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

load_dotenv()
INDEX_NAME = "un_documents_index"

def clean_text(text: str) -> str:
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def connect():
    client = Elasticsearch(
        getenv("ELASTIC_ENDPOINT"),
        api_key=getenv("ELASTIC_API_KEY"),
        request_timeout=60
    )
    print(f'Connected to Elasticsearch: {client}')
    return client

INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "content": {"type": "text"},
            "source": {"type": "keyword"},
            "embedding": {"type": "dense_vector", "dims": 1536}
        }
    }
}

def create_index(client):
    if client.indices.exists(index=INDEX_NAME):
        client.indices.delete(index=INDEX_NAME)
        print(f'Index {INDEX_NAME} deleted')
    client.indices.create(index=INDEX_NAME, body=INDEX_MAPPING)
    print(f'Index {INDEX_NAME} created')

def index_documents(client):
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50)

    docs = []
    for txt_file in Path("data/processed").glob("*.txt"):
        loader = TextLoader(str(txt_file), encoding="utf-8")
        docs.extend(loader.load())

    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks")

    BATCH_SIZE = 100
    total_indexed = 0

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        actions = []
        for chunk in batch:
            cleaned = clean_text(chunk.page_content)
            vector = embeddings.embed_query(cleaned)
            actions.append({
                "_index": INDEX_NAME,
                "_source": {
                    "content": cleaned,
                    "source": chunk.metadata.get("source", "unknown"),
                    "embedding": vector
                }
            })
        bulk(client, actions)
        total_indexed += len(batch)
        print(f"Indexed {total_indexed}/{len(chunks)} chunks")

if __name__ == "__main__":
    client = connect()
    create_index(client)
    index_documents(client)