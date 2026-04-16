#!/usr/bin/env bash
# configure-containerapp.sh — Wire Key Vault secrets as env vars on the Container App.
# Run once after provision.sh + keyvault-sync.sh.
#
# The Container App reads each env var from a KV secret reference via its
# system-assigned managed identity (which must have Key Vault Secrets User role).

set -euo pipefail

APP="governance-backend"
RG="rg-governance-demo"
VAULT="gov-demo-kv-truos"
KV_URL="https://$VAULT.vault.azure.net/secrets"
IDENTITY="system"

echo "=== Configuring Container App secrets (KV references) ==="

az containerapp secret set \
  --name "$APP" \
  --resource-group "$RG" \
  --secrets \
    "openai-api-key=keyvaultref:$KV_URL/OPENAI-API-KEY,identityref:$IDENTITY" \
    "redis-host=keyvaultref:$KV_URL/REDIS-HOST,identityref:$IDENTITY" \
    "redis-port=keyvaultref:$KV_URL/REDIS-PORT,identityref:$IDENTITY" \
    "redis-password=keyvaultref:$KV_URL/REDIS-PASSWORD,identityref:$IDENTITY" \
    "redis-ssl=keyvaultref:$KV_URL/REDIS-SSL,identityref:$IDENTITY" \
    "elastic-endpoint=keyvaultref:$KV_URL/ELASTIC-ENDPOINT,identityref:$IDENTITY" \
    "elastic-api-key=keyvaultref:$KV_URL/ELASTIC-API-KEY,identityref:$IDENTITY" \
    "langchain-api-key=keyvaultref:$KV_URL/LANGCHAIN-API-KEY,identityref:$IDENTITY" \
    "langchain-project=keyvaultref:$KV_URL/LANGCHAIN-PROJECT,identityref:$IDENTITY" \
    "azure-language-endpoint=keyvaultref:$KV_URL/AZURE-LANGUAGE-ENDPOINT,identityref:$IDENTITY" \
    "azure-language-key=keyvaultref:$KV_URL/AZURE-LANGUAGE-KEY,identityref:$IDENTITY" \
    "cors-origins=keyvaultref:$KV_URL/CORS-ORIGINS,identityref:$IDENTITY" \
  --output none

echo "=== Setting environment variables from secrets ==="

az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --set-env-vars \
    "OPENAI_API_KEY=secretref:openai-api-key" \
    "REDIS_HOST=secretref:redis-host" \
    "REDIS_PORT=secretref:redis-port" \
    "REDIS_PASSWORD=secretref:redis-password" \
    "REDIS_SSL=secretref:redis-ssl" \
    "ELASTIC_ENDPOINT=secretref:elastic-endpoint" \
    "ELASTIC_API_KEY=secretref:elastic-api-key" \
    "LANGCHAIN_API_KEY=secretref:langchain-api-key" \
    "LANGCHAIN_PROJECT=secretref:langchain-project" \
    "AZURE_LANGUAGE_ENDPOINT=secretref:azure-language-endpoint" \
    "AZURE_LANGUAGE_KEY=secretref:azure-language-key" \
    "CORS_ORIGINS=secretref:cors-origins" \
    "LANGCHAIN_TRACING_V2=true" \
    "REDIS_SOCKET_TIMEOUT=10" \
    "REDIS_SOCKET_CONNECT_TIMEOUT=10" \
  --output none

echo "    OK: Container App configured"
