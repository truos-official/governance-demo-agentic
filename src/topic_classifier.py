import json
from pathlib import Path
from urllib import response
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()
TOPICS_FILE=Path("data/topics.json")

def load_topics()->list:
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

if __name__=="__main__":
    topics=load_topics()
    results=classify_query("What are the best practices for data privacy?", topics)
    print(results)