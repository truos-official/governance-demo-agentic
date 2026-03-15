import os
import redis
from decimal import Decimal
from dotenv import load_dotenv
from langsmith import Client
from elasticsearch import Elasticsearch

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

def track_pii_entity(entity_type: str):
    client = get_redis_client()
    client.incr(f"metrics:pii_entity:{entity_type}")

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
        n = len(latencies)
        def percentile(data, p):
            idx = int(len(data) * p / 100)
            return f"{data[min(idx, len(data)-1)]:.2f}s"
        return {
            "p50": percentile(latencies, 50),
            "p95": percentile(latencies, 95),
            "p99": percentile(latencies, 99),
            "min": f"{latencies[0]:.2f}s",
            "max": f"{latencies[-1]:.2f}s",
            "sample_size": n
        }
    except Exception as e:
        print(f"Latency percentile error: {e}")
        return {"p50": "—", "p95": "—", "p99": "—", "min": "—", "max": "—"}

def get_langsmith_metrics() -> dict:
    try:
        client = Client()
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
        mapping = client.indices.get_mapping(index="un_documents_index")
        fields = mapping["un_documents_index"]["mappings"]["properties"].keys()
        return {
            "document_count": count["count"],
            "index_size": "Serverless",
            "avg_search_time": "Serverless",
            "total_searches": "Serverless",
            "total_indexing_ops": "Serverless",
            "fields": list(fields)
        }
    except Exception as e:
        print(f"Elasticsearch metrics error: {e}")
        return {}

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

    langsmith = get_langsmith_metrics()
    latency_percentiles = get_latency_percentiles()
    redis_infra = get_redis_infrastructure_metrics()
    es_metrics = get_elasticsearch_metrics()
    pii_entities = get_pii_entity_breakdown()

    return {
        # Application — Redis
        "total_queries": total,
        "cache_hit_rate": f"{(cache_hits / total * 100):.0f}%" if total > 0 else "0%",
        "hallucination_rate": f"{(hallucinations / total * 100):.0f}%" if total > 0 else "0%",
        "pii_detection_rate": f"{(pii_detected / total * 100):.0f}%" if total > 0 else "0%",
        "security_block_rate": f"{(injection_attempts / total * 100):.0f}%" if total > 0 else "0%",
        "style_distribution": style_distribution,
        "top_sources": top_sources,

        # Latency percentiles — Redis
        "latency_p50": latency_percentiles.get("p50", "—"),
        "latency_p95": latency_percentiles.get("p95", "—"),
        "latency_p99": latency_percentiles.get("p99", "—"),
        "latency_min": latency_percentiles.get("min", "—"),
        "latency_max": latency_percentiles.get("max", "—"),

        # LLM — LangSmith
        "avg_latency": langsmith["avg_latency"],
        "p95_latency": langsmith["p95_latency"],
        "total_tokens": langsmith["total_tokens"],
        "prompt_tokens": langsmith["prompt_tokens"],
        "completion_tokens": langsmith["completion_tokens"],
        "total_cost": langsmith["total_cost"],
        "cost_per_query": langsmith["cost_per_query"],
        "error_rate": langsmith["error_rate"],
        "total_llm_runs": langsmith["total_llm_runs"],
        "model_distribution": langsmith["model_distribution"],

        # Elasticsearch
        "es_document_count": es_metrics.get("document_count", "—"),
        "es_index_size": es_metrics.get("index_size", "—"),
        "es_total_searches": es_metrics.get("total_searches", "—"),
        "es_avg_search_time": es_metrics.get("avg_search_time", "—"),
        "es_total_indexing_ops": es_metrics.get("total_indexing_ops", "—"),

        # Redis infrastructure
        "redis_memory_used": redis_infra.get("memory_used", "—"),
        "redis_memory_peak": redis_infra.get("memory_peak", "—"),
        "redis_connected_clients": redis_infra.get("connected_clients", "—"),
        "redis_keyspace_hit_ratio": redis_infra.get("keyspace_hit_ratio", "—"),
        "redis_total_keys": redis_infra.get("total_keys", "—"),
        "redis_uptime_days": redis_infra.get("uptime_days", "—"),

        # PII entity breakdown
        "pii_entity_breakdown": pii_entities,
    }

def get_security_events() -> dict:
    client = get_redis_client()
    return {
        "injection_attempts": int(client.get("security:injection") or 0),
        "pii_detected": int(client.get("security:pii") or 0),
        "rate_limit_hits": int(client.get("security:rate_limit") or 0),
    }