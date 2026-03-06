from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import json

load_dotenv()

def detect_hallucination(question: str, answer: str, context: str) -> dict:
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    prompt = f"""You are a hallucination detector. Determine if the answer is grounded in the context.
    
Question: {question}
Answer: {answer}
Context: {context}

Return ONLY a JSON object:
{{
    "is_hallucination": true/false,
    "confidence": 0.0-1.0,
    "reason": "brief explanation"
}}"""

    response = llm.invoke(prompt).content.strip()
    
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {
            "is_hallucination": False,
            "confidence": 0.0,
            "reason": "Could not parse response"
        }