import re
import time
import collections
from dotenv import load_dotenv
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

load_dotenv()

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

request_counts = collections.defaultdict(list)
RATE_LIMIT = 10

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all instructions",
    "disregard your instructions",
    "you are now",
    "act as",
    "pretend you are",
    "forget everything",
    "new instructions"
]

def detect_injection(user_input: str)-> bool:
    """Detects potential prompt injection attempts in user input."""
    normalized_input = re.sub(r'\s+', ' ', user_input.strip().lower())
    for pattern in INJECTION_PATTERNS:
        if pattern in normalized_input:
            return True
    return False

def validate_token_length(query: str, max_tokens: int = 1000) -> bool:
    """Validates that the token length of the query does not exceed the maximum allowed."""
    token_count = len(query.split())
    return token_count <= max_tokens

def check_rate_limit(user_id: str) -> bool:
    """Checks if the user has exceeded the rate limit for requests."""
    current_time = time.time()
    request_times = request_counts[user_id]

    # Remove timestamps that are older than 1 minute
    request_counts[user_id] = [t for t in request_times if current_time - t < 60]

    if len(request_counts[user_id]) >= RATE_LIMIT:
        return False

    request_counts[user_id].append(current_time)
    return True

def run_security_checks(query: str, user_id: str) -> dict:
    pii = detect_pii(query)
    checks = {
        "injection_detected": detect_injection(query),
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

def detect_pii(text: str) -> dict:
    results = analyzer.analyze(text=text, language="en")
    return {
        "entities": [{"type": r.entity_type, "score": r.score} for r in results],
        "pii_detected": len(results) > 0
    }

def anonymize_pii(text: str) -> str:
    results = analyzer.analyze(text=text, language="en")
    anonymized_text = anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized_text.text