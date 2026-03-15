import json
import os
import time
import requests
from evaluator import evaluate
from report import print_report

API_URL = os.getenv("API_URL", "http://localhost:8000")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_CASES_FILE = os.path.join(BASE_DIR, "data", "test_cases.json")


def load_test_cases() -> list:
    with open(TEST_CASES_FILE, encoding="utf-8") as f:
        return json.load(f)


def run_query(query: str) -> tuple[dict | None, int, float]:
    start = time.time()
    try:
        resp = requests.post(
            f"{API_URL}/query",
            json={"question": query, "user_id": "bulk_test"},
            timeout=30
        )
        latency = time.time() - start
        return resp.json() if resp.status_code in [200, 400] else None, resp.status_code, latency
    except Exception as e:
        return None, 0, time.time() - start


def run_tests():
    test_cases = load_test_cases()
    results = []

    print(f"\nRunning {len(test_cases)} tests against {API_URL}...\n")

    for test in test_cases:
        print(f"[{test['id']:02d}] {test['category'].upper()} — {test['query'][:60]}...")
        response_data, status_code, latency = run_query(test["query"])
        evaluation = evaluate(test, response_data, status_code)
        icon = "✓" if evaluation["pass"] else "✗"
        print(f"     {icon} {evaluation['actual']} | {latency:.1f}s")
        if not evaluation["pass"] and evaluation["notes"]:
            print(f"     Notes: {evaluation['notes'][:120]}")
        print()

        results.append({
            "id": test["id"],
            "category": test["category"],
            "query": test["query"],
            "expected_outcome": test["expected_outcome"],
            "actual": evaluation["actual"],
            "pass": evaluation["pass"],
            "latency": round(latency, 2),
            "notes": evaluation["notes"]
        })

        time.sleep(1)

    print_report(results)


if __name__ == "__main__":
    run_tests()