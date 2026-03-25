# tests/conftest.py
import os

_defaults = {
    "REDIS_HOST": "localhost",
    "REDIS_PORT": "6380",
    "REDIS_PASSWORD": "placeholder",
    "REDIS_SSL": "false",
    "REDIS_SOCKET_TIMEOUT": "30",
    "REDIS_SOCKET_CONNECT_TIMEOUT": "30",
    "OPENAI_API_KEY": "sk-test-placeholder",
    "ELASTIC_ENDPOINT": "https://localhost:9200",
    "ELASTIC_API_KEY": "placeholder",
    "LANGCHAIN_API_KEY": "placeholder",
    "LANGCHAIN_PROJECT": "test",
    "LANGCHAIN_TRACING_V2": "false",
    "AZURE_LANGUAGE_ENDPOINT": "https://eastus.api.cognitive.microsoft.com/",
    "AZURE_LANGUAGE_KEY": "placeholder",
    "CORS_ORIGINS": "http://localhost:3000",
}

for key, val in _defaults.items():
    os.environ.setdefault(key, val)