import os
import json
import redis
import ssl
from decimal import Decimal
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from langsmith import Client
from elasticsearch import Elasticsearch

load_dotenv()

REDIS_SOCKET_TIMEOUT = int(os.getenv("REDIS_SOCKET_TIMEOUT", 5))
REDIS_SOCKET_CONNECT_TIMEOUT = int(os.getenv("REDIS_SOCKET_CONNECT_TIMEOUT", 5))
REDIS_SSL = os.getenv("REDIS_SSL", "false").lower() == "true"

def get_redis_client():
    ssl_context = None
    if REDIS_SSL:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

    return redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT", 11423)),
        password=os.getenv("REDIS_PASSWORD"),
        ssl=REDIS_SSL,
        ssl_context=ssl_context if REDIS_SSL else None,
        decode_responses=True,
        socket_timeout=REDIS_SOCKET_TIMEOUT,
        socket_connect_timeout=REDIS_SOCKET_CONNECT_TIMEOUT
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

def track_pii_entity(entity_type: str):
    client = get_redis_client()
    client.incr(f"metrics:pii_entity:{entity_type}")

def track_user_query(user_id: str, style: str, is_hallucination: bool, latency: float):
    if not user_id or user_id in ("anonymous", "dev_user", "eval_run", "demo_user"):
        return
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"USER_QUERY: user_id={user_id} style={style} hallucination={is_hallucination} latency={latency:.2f}s")
    client = get_redis_client()
    client.incr(f"user:{user_id}:total_queries")
    client.incr(f"user:{user_id}:style:{style}")
    if is_hallucination:
        client.incr(f"user:{user_id}:hallucinations")
    client.lpush(f"user:{user_id}:latencies", latency)
    client.ltrim(f"user:{user_id}:latencies", 0, 99)
    client.set(f"user:{user_id}:last_active", datetime.utcnow().isoformat())

def get_user_metrics(user_id: str) -> dict:
    try:
        client = get_redis_client()
        total = int(client.get(f"user:{user_id}:total_queries") or 0)
        hallucinations = int(client.get(f"user:{user_id}:hallucinations") or 0)
        last_active = client.get(f"user:{user_id}:last_active") or "—"
        style_distribution = {}
        for style in ["factual", "analytical", "summary", "safety", "adversarial"]:
            count = int(client.get(f"user:{user_id}:style:{style}") or 0)
            if count > 0:
                style_distribution[style] = count
        raw_latencies = client.lrange(f"user:{user_id}:latencies", 0, -1)
        latencies = sorted([float(x) for x in raw_latencies]) if raw_latencies else []
        avg_latency = f"{sum(latencies) / len(latencies):.1f}s" if latencies else "—"
        return {
            "total_queries": total,
            "hallucination_rate": f"{(hallucinations / total * 100):.0f}%" if total > 0 else "0%",
            "avg_latency": avg_latency,
            "style_distribution": style_distribution,
            "last_active": last_active[:10] if last_active != "—" else "—"
        }
    except Exception as e:
        print(f"User metrics error: {e}")
        return {"total_queries": 0, "hallucination_rate": "0%", "avg_latency": "—", "style_distribution": {}, "last_active": "—"}

def get_all_user_activity() -> list:
    try:
        client = get_redis_client()
        user_ids = client.smembers("users:all")
        users = []
        for uid in user_ids:
            raw = client.get(f"user:{uid}:profile")
            if raw:
                profile = json.loads(raw)
                metrics = get_user_metrics(uid)
                users.append({**profile, **metrics})
        users.sort(key=lambda x: x.get("total_queries", 0), reverse=True)
        return users
    except Exception as e:
        print(f"User activity error: {e}")
        return []

def get_redis_infrastructure_metrics() -> dict:
    try:
        client = get_redis_client()
        info = client.info()
        keyspace = client.info("keyspace")
        total_keys = sum(v.get("keys", 0) for v in keyspace.values()) if keyspace else 0
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        hit_ratio = f"{(hits / (hits + misses) * 100):.0f}%" if (hits + misses) > 0 else "0%"
        return {
            "memory_used": f"{info.get('used_memory_human', '—')}",
            "memory_peak": f"{info.get('used_memory_peak_human', '—')}",
            "connected_clients": info.get("connected_clients", 0),
            "total_commands": info.get("total_commands_processed", 0),
            "keyspace_hit_ratio": hit_ratio,
            "total_keys": total_keys,
            "uptime_days": info.get("uptime_in_days", 0),
        }
    except Exception as e:
        print(f"Redis infrastructure error: {e}")
        return {}

def get_latency_percentiles() -> dict:
    try:
        client = get_redis_client()
        raw = client.lrange("metrics:latencies", 0, -1)
        if not raw:
            return {"p50": "—", "p95": "—", "p99": "—", "min": "—", "max": "—"}
        latencies = sorted([float(x) for x in raw])
        def percentile(data, p):
            idx = int(len(data) * p / 100)
            return f"{data[min(idx, len(data)-1)]:.2f}s"
        return {
            "p50": percentile(latencies, 50),
            "p95": percentile(latencies, 95),
            "p99": percentile(latencies, 99),
            "min": f"{latencies[0]:.2f}s",
            "max": f"{latencies[-1]:.2f}s",
            "sample_size": len(latencies)
        }
    except Exception as e:
        print(f"Latency percentile error: {e}")
        return {"p50": "—", "p95": "—", "p99": "—", "min": "—", "max": "—"}

def get_langsmith_metrics() -> dict:
    try:
        client = Client(timeout_ms=10000)
        runs = list(client.list_runs(
            project_name=os.getenv("LANGCHAIN_PROJECT", "un-governance-demo"),
            run_type="llm",
            limit=100
        ))
        if not runs:
            return {
                "avg_latency": "—", "total_tokens": 0, "total_cost": "$0.00",
                "error_rate": "0%", "total_llm_runs": 0,
                "prompt_tokens": 0, "completion_tokens": 0,
                "cost_per_query": "$0.00", "p95_latency": "—",
                "model_distribution": {}
            }
        total_tokens = 0
        prompt_tokens = 0
        completion_tokens = 0
        total_cost = Decimal("0")
        errors = 0
        latencies = []
        model_distribution = {}
        for run in runs:
            total_tokens += run.total_tokens or 0
            prompt_tokens += run.prompt_tokens or 0
            completion_tokens += run.completion_tokens or 0
            total_cost += run.total_cost or Decimal("0")
            if run.status == "error":
                errors += 1
            if run.end_time and run.start_time:
                latencies.append((run.end_time - run.start_time).total_seconds())
            model = getattr(run, "extra", {}).get("invocation_params", {}).get("model_name", "unknown") if run.extra else "unknown"
            model_distribution[model] = model_distribution.get(model, 0) + 1
        latencies_sorted = sorted(latencies)
        avg_latency = f"{sum(latencies) / len(latencies):.2f}s" if latencies else "—"
        p95_idx = int(len(latencies_sorted) * 0.95)
        p95_latency = f"{latencies_sorted[min(p95_idx, len(latencies_sorted)-1)]:.2f}s" if latencies_sorted else "—"
        error_rate = f"{(errors / len(runs) * 100):.0f}%" if runs else "0%"
        cost_per_query = f"${float(total_cost) / len(runs):.6f}" if runs else "$0.00"
        return {
            "avg_latency": avg_latency,
            "p95_latency": p95_latency,
            "total_tokens": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_cost": f"${float(total_cost):.4f}",
            "cost_per_query": cost_per_query,
            "error_rate": error_rate,
            "total_llm_runs": len(runs),
            "model_distribution": model_distribution
        }
    except Exception as e:
        print(f"LangSmith error: {e}")
        return {
            "avg_latency": "—", "total_tokens": 0, "total_cost": "$0.00",
            "error_rate": "—", "total_llm_runs": 0,
            "prompt_tokens": 0, "completion_tokens": 0,
            "cost_per_query": "$0.00", "p95_latency": "—",
            "model_distribution": {}
        }

def get_elasticsearch_metrics() -> dict:
    try:
        client = Elasticsearch(
            os.getenv("ELASTIC_ENDPOINT"),
            api_key=os.getenv("ELASTIC_API_KEY"),
            request_timeout=10
        )
        count = client.count(index="un_documents_index")
        return {"document_count": count["count"]}
    except Exception as e:
        print(f"Elasticsearch metrics error: {e}")
        return {"document_count": "—"}

def get_pii_entity_breakdown() -> dict:
    try:
        client = get_redis_client()
        entities = {}
        for key in client.scan_iter("metrics:pii_entity:*"):
            entity_type = key.replace("metrics:pii_entity:", "")
            entities[entity_type] = int(client.get(key) or 0)
        return entities
    except Exception as e:
        print(f"PII entity breakdown error: {e}")
        return {}

def get_metrics() -> dict:
    try:
        client = get_redis_client()
        total = int(client.get("metrics:total_queries") or 0)
        cache_hits = int(client.get("metrics:cache_hits") or 0)
        hallucinations = int(client.get("metrics:hallucinations") or 0)
        pii_detected = int(client.get("metrics:pii_detected") or 0)
        injection_attempts = int(client.get("security:injection") or 0)

        style_distribution = {}
        for style in ["factual", "analytical", "summary", "safety", "adversarial"]:
            count = int(client.get(f"metrics:style:{style}") or 0)
            if count > 0:
                style_distribution[style] = count

        top_sources = {}
        for key in client.scan_iter("metrics:source:*"):
            source = key.replace("metrics:source:", "")
            top_sources[source] = int(client.get(key) or 0)
    except Exception as e:
        print(f"Redis metrics error: {e}")
        total = cache_hits = hallucinations = pii_detected = injection_attempts = 0
        style_distribution = {}
        top_sources = {}

    # Fetch external metrics concurrently
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            "langsmith": executor.submit(get_langsmith_metrics),
            "latency": executor.submit(get_latency_percentiles),
            "redis_infra": executor.submit(get_redis_infrastructure_metrics),
            "es": executor.submit(get_elasticsearch_metrics),
            "pii_entities": executor.submit(get_pii_entity_breakdown),
            "user_activity": executor.submit(get_all_user_activity),
        }
        results = {}
        for key, future in futures.items():
            try:
                results[key] = future.result(timeout=15)
            except Exception as e:
                print(f"Metrics fetch failed for {key}: {e}")
                results[key] = {}

    langsmith = results.get("langsmith", {})
    latency_percentiles = results.get("latency", {})
    redis_infra = results.get("redis_infra", {})
    es_metrics = results.get("es", {})
    pii_entities = results.get("pii_entities", {})
    user_activity = results.get("user_activity", [])

    return {
        "total_queries": total,
        "cache_hit_rate": f"{(cache_hits / total * 100):.0f}%" if total > 0 else "0%",
        "hallucination_rate": f"{(hallucinations / total * 100):.0f}%" if total > 0 else "0%",
        "pii_detection_rate": f"{(pii_detected / total * 100):.0f}%" if total > 0 else "0%",
        "security_block_rate": f"{(injection_attempts / total * 100):.0f}%" if total > 0 else "0%",
        "style_distribution": style_distribution,
        "top_sources": top_sources,
        "latency_p50": latency_percentiles.get("p50", "—"),
        "latency_p95": latency_percentiles.get("p95", "—"),
        "latency_p99": latency_percentiles.get("p99", "—"),
        "latency_min": latency_percentiles.get("min", "—"),
        "latency_max": latency_percentiles.get("max", "—"),
        "avg_latency": langsmith.get("avg_latency", "—"),
        "p95_latency": langsmith.get("p95_latency", "—"),
        "total_tokens": langsmith.get("total_tokens", 0),
        "prompt_tokens": langsmith.get("prompt_tokens", 0),
        "completion_tokens": langsmith.get("completion_tokens", 0),
        "total_cost": langsmith.get("total_cost", "$0.00"),
        "cost_per_query": langsmith.get("cost_per_query", "$0.00"),
        "error_rate": langsmith.get("error_rate", "—"),
        "total_llm_runs": langsmith.get("total_llm_runs", 0),
        "model_distribution": langsmith.get("model_distribution", {}),
        "es_document_count": es_metrics.get("document_count", "—"),
        "redis_memory_used": redis_infra.get("memory_used", "—"),
        "redis_memory_peak": redis_infra.get("memory_peak", "—"),
        "redis_connected_clients": redis_infra.get("connected_clients", "—"),
        "redis_keyspace_hit_ratio": redis_infra.get("keyspace_hit_ratio", "—"),
        "redis_total_keys": redis_infra.get("total_keys", "—"),
        "redis_uptime_days": redis_infra.get("uptime_days", "—"),
        "pii_entity_breakdown": pii_entities,
        "user_activity": user_activity,
        "total_registered_users": len(user_activity),
    }

def get_security_events() -> dict:
    try:
        client = get_redis_client()
        return {
            "injection_attempts": int(client.get("security:injection") or 0),
            "pii_detected": int(client.get("security:pii") or 0),
            "rate_limit_hits": int(client.get("security:rate_limit") or 0),
        }
    except Exception as e:
        print(f"Security events error: {e}")
        return {"injection_attempts": 0, "pii_detected": 0, "rate_limit_hits": 0}