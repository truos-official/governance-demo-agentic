import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import TextLoader

load_dotenv()

PROCESSED_DIR=Path("data/processed")
TOPICS_FILE = Path("data/topics.json")

def load_documents():
    documents=[]
    for file in PROCESSED_DIR.glob("*.txt"):
        loader = TextLoader(str(file), encoding="utf-8")
        documents.extend(loader.load())
    return documents

def extract_topics(docs):
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    full_text = " ".join([d.page_content[:500] for d in docs])
    response = llm.invoke(f"""Analyze the following UN documents and extract 8-10 broad governance topic categories.
Topics should be high-level themes, not specific document titles or sessions.
Good examples: "Military AI", "Human Rights", "Private Sector Accountability"
Bad examples: "Human Rights Council Fifty-ninth session", "Annual Report of..."
Return ONLY a JSON array of topic strings, nothing else.

Documents:
{full_text}
""")
    topics = json.loads(response.content)
    return topics

def save_topics(topics):
    with open(TOPICS_FILE, "w") as f:
        json.dump(topics, f, indent=2)
    print(f"Saved {len(topics)} topics to {TOPICS_FILE}")

if __name__ == "__main__":
    documents = load_documents()
    print(f"Loaded {len(documents)} documents.")
    topics = extract_topics(documents)
    print(f"Extracted {len(topics)} topics.")
    save_topics(topics)