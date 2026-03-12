import os
import redis
from decimal import Decimal
from dotenv import load_dotenv
from langsmith import Client

load_dotenv()

def get_redis_client():
    return redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=False,
        decode_responses=True
    )

def track_query(style: str, sources: list, is_hallucination: bool, cache_hit: bool, pii_detected: bool, latency: float):
    client = get_redis_client()
    client.incr("metrics:total_queries")
    client.incr(f"metrics:style:{style}")
    if cache_hit:
        client.incr("metrics:cache_hits")
    if is_hallucination:
        client.incr("metrics:hallucinations")
    if pii_detected:
        client.incr("metrics:pii_detected")
    for source in sources:
        client.incr(f"metrics:source:{source}")
    client.lpush("metrics:latencies", latency)
    client.ltrim("metrics:latencies", 0, 999)

def track_security_event(event_type: str):
    client = get_redis_client()
    client.incr(f"security:{event_type}")

def get_langsmith_metrics() -> dict:
    try:
        client = Client()
        runs = list(client.list_runs(
            project_name=os.getenv("LANGCHAIN_PROJECT", "un-governance-demo"),
            run_type="llm",
            limit=100
        ))

        if not runs:
            return {"avg_latency": "—", "total_tokens": 0, "total_cost": "$0.00", "error_rate": "0%", "total_llm_runs": 0}

        total_tokens = 0
        total_cost = Decimal("0")
        errors = 0
        latencies = []

        for run in runs:
            total_tokens += run.total_tokens or 0
            total_cost += run.total_cost or Decimal("0")
            if run.status == "error":
                errors += 1
            if run.end_time and run.start_time:
                latency = (run.end_time - run.start_time).total_seconds()
                latencies.append(latency)

        avg_latency = f"{sum(latencies) / len(latencies):.2f}s" if latencies else "—"
        error_rate = f"{(errors / len(runs) * 100):.0f}%" if runs else "0%"

        return {
            "avg_latency": avg_latency,
            "total_tokens": total_tokens,
            "total_cost": f"${float(total_cost):.4f}",
            "error_rate": error_rate,
            "total_llm_runs": len(runs)
        }
    except Exception as e:
        print(f"LangSmith error: {e}")
        return {"avg_latency": "—", "total_tokens": 0, "total_cost": "$0.00", "error_rate": "—", "total_llm_runs": 0}

def get_metrics() -> dict:
    client = get_redis_client()
    total = int(client.get("metrics:total_queries") or 0)
    cache_hits = int(client.get("metrics:cache_hits") or 0)
    hallucinations = int(client.get("metrics:hallucinations") or 0)
    pii_detected = int(client.get("metrics:pii_detected") or 0)

    style_distribution = {}
    for style in ["factual", "analytical", "summary", "safety", "adversarial"]:
        count = int(client.get(f"metrics:style:{style}") or 0)
        if count > 0:
            style_distribution[style] = count

    top_sources = {}
    for key in client.scan_iter("metrics:source:*"):
        source = key.replace("metrics:source:", "")
        top_sources[source] = int(client.get(key) or 0)

    langsmith = get_langsmith_metrics()

    return {
        "total_queries": total,
        "cache_hit_rate": f"{(cache_hits / total * 100):.0f}%" if total > 0 else "0%",
        "hallucination_rate": f"{(hallucinations / total * 100):.0f}%" if total > 0 else "0%",
        "pii_detection_rate": f"{(pii_detected / total * 100):.0f}%" if total > 0 else "0%",
        "security_block_rate": "0%",
        "style_distribution": style_distribution,
        "top_sources": top_sources,
        "avg_latency": langsmith["avg_latency"],
        "total_tokens": langsmith["total_tokens"],
        "total_cost": langsmith["total_cost"],
        "error_rate": langsmith["error_rate"],
        "total_llm_runs": langsmith["total_llm_runs"]
    }

def get_security_events() -> dict:
    client = get_redis_client()
    return {
        "injection_attempts": int(client.get("security:injection") or 0),
        "pii_detected": int(client.get("security:pii") or 0),
        "rate_limit_hits": int(client.get("security:rate_limit") or 0),
    }