from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import json

load_dotenv()

def detect_hallucination(question: str, answer: str, context: str) -> dict:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    prompt = f"""You are a hallucination detector for a UN AI governance assistant.

This system answers questions using UN documents as primary source and supplements with accurate general knowledge on AI governance, human rights law, and UN policy when documents are insufficient.

STRICT RULES — only flag as hallucination if:
- The answer invents specific document references, resolution numbers, or quotes that do not appear in the context
- The answer makes specific statistical claims or dates that contradict the context
- The answer directly contradicts factual content in the context
- The answer fabricates named individuals, organizations, or events not in the context

DO NOT flag as hallucination if:
- The answer references well-established principles of international human rights law
- The answer mentions widely known UN bodies, treaties, or frameworks not in the context
- The answer supplements sparse context with accurate general knowledge about AI governance
- The answer is a reasonable inference from the context even if not stated word for word
- The context is sparse or general but the answer is factually accurate

When in doubt — do NOT flag as hallucination. Only flag clear factual fabrications.

Question: {question}
Answer: {answer}
Context: {context}

Return ONLY a JSON object with no markdown:
{{"is_hallucination": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}}"""

    try:
        response = llm.invoke(prompt).content.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        return json.loads(response.strip())
    except Exception:
        return {
            "is_hallucination": False,
            "confidence": 0.0,
            "reason": "Could not parse response"
        }