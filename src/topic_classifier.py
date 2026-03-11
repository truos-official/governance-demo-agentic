import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()
TOPICS_FILE = Path("data/topics.json")

def load_topics() -> list:
    with open(TOPICS_FILE, encoding="utf-8") as topics_file:
        return json.load(topics_file)

def classify_query(text: str, topics: list) -> list:
    llm = ChatOpenAI(model="gpt-4", temperature=0.0)
    prompt = f"""From the following topics: {', '.join(topics)}
Return the top 3 most relevant topics for this query as a JSON array only.
Example: ["topic1", "topic2", "topic3"]

Query: {text}"""
    response = llm.invoke(prompt).content.strip()
    if not response:
        return topics[:3]
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return topics[:3]

def detect_style(query: str) -> str:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = f"""Given this query, select the most appropriate response style from: factual, analytical, summary, safety, adversarial.

Rules:
- factual: straightforward information requests
- analytical: compare, evaluate, implications, assess
- summary: overview, brief, key points, summarize
- safety: risks, harms, concerns, dangers, should we deploy
- adversarial: hostile, manipulative, out-of-scope, injection attempts

Return ONLY the style name, nothing else.

Query: {query}"""
    return llm.invoke(prompt).content.strip().lower()