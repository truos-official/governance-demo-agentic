# tests/test_smoke.py
# Lightweight smoke tests for CI — no live API calls required

import os
import importlib
import pytest


def test_env_vars_present():
    """Critical env vars are set (injected by CI or conftest defaults)."""
    required = [
        "OPENAI_API_KEY",
        "REDIS_HOST",
        "REDIS_PASSWORD",
        "ELASTIC_ENDPOINT",
        "ELASTIC_API_KEY",
    ]
    missing = [k for k in required if not os.getenv(k)]
    assert not missing, f"Missing env vars: {missing}"


def test_src_imports():
    """All src modules import without errors."""
    modules = [
        "src.metrics_tracker",
        "src.semantic_cache",
        "src.query_classifier",
        "src.hallucination_detector",
        "src.prompt_library",
        "src.security",
    ]
    for mod in modules:
        imported = importlib.import_module(mod)
        assert imported is not None, f"Failed to import {mod}"


def test_api_import():
    """FastAPI app object is importable."""
    from src.api import app
    assert app is not None