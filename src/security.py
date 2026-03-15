import json
import time
import collections
from dotenv import load_dotenv
from os import getenv
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from src.metrics_tracker import track_pii_entity

load_dotenv()

request_counts = collections.defaultdict(list)
RATE_LIMIT = 10

def get_azure_language_client():
    endpoint = getenv("AZURE_LANGUAGE_ENDPOINT")
    key = getenv("AZURE_LANGUAGE_KEY")
    return TextAnalyticsClient(endpoint=endpoint, credential=AzureKeyCredential(key))

def validate_token_length(query: str, max_tokens: int = 1000) -> bool:
    return len(query.split()) <= max_tokens

def check_rate_limit(user_id: str) -> bool:
    current_time = time.time()
    request_counts[user_id] = [t for t in request_counts[user_id] if current_time - t < 60]
    if len(request_counts[user_id]) >= RATE_LIMIT:
        return False
    request_counts[user_id].append(current_time)
    return True

def detect_pii(text: str) -> dict:
    try:
        client = get_azure_language_client()
        response = client.recognize_pii_entities([text], language="en")
        result = response[0]
        if result.is_error:
            return {"entities": [], "pii_detected": False}
        entities = [{"type": e.category, "score": e.confidence_score} for e in result.entities]
        for e in result.entities:
            track_pii_entity(e.category)
        return {"entities": entities, "pii_detected": len(entities) > 0}
    except Exception as e:
        print(f"PII detection error: {e}")
        return {"entities": [], "pii_detected": False}

def anonymize_pii(text: str) -> str:
    try:
        client = get_azure_language_client()
        response = client.recognize_pii_entities([text], language="en")
        result = response[0]
        if result.is_error:
            return text
        return result.redacted_text
    except Exception as e:
        print(f"PII anonymization error: {e}")
        return text

def run_security_checks(query: str, user_id: str, is_injection: bool = False) -> dict:
    pii = detect_pii(query)
    checks = {
        "injection_detected": is_injection,
        "token_length_valid": validate_token_length(query),
        "rate_limit_ok": check_rate_limit(user_id),
        "pii_detected": pii["pii_detected"],
        "pii_entities": pii["entities"]
    }
    checks["passed"] = (
        not checks["injection_detected"] and
        checks["token_length_valid"] and
        checks["rate_limit_ok"]
    )
    return checks