#!/usr/bin/env bash
# keyvault-sync.sh — Push all application secrets into Azure Key Vault.
# Run this after provision.sh and whenever a secret value changes.
#
# Usage:
#   export OPENAI_API_KEY="sk-proj-..."
#   export REDIS_PASSWORD="..."
#   ... (set all variables below)
#   chmod +x scripts/keyvault-sync.sh
#   ./scripts/keyvault-sync.sh

set -euo pipefail

VAULT="gov-demo-kv-truos"

: "${OPENAI_API_KEY:?Need OPENAI_API_KEY}"
: "${REDIS_HOST:?Need REDIS_HOST}"
: "${REDIS_PORT:?Need REDIS_PORT}"
: "${REDIS_PASSWORD:?Need REDIS_PASSWORD}"
: "${REDIS_SSL:?Need REDIS_SSL}"
: "${ELASTIC_ENDPOINT:?Need ELASTIC_ENDPOINT}"
: "${ELASTIC_API_KEY:?Need ELASTIC_API_KEY}"
: "${LANGCHAIN_API_KEY:?Need LANGCHAIN_API_KEY}"
: "${LANGCHAIN_PROJECT:?Need LANGCHAIN_PROJECT}"
: "${AZURE_LANGUAGE_ENDPOINT:?Need AZURE_LANGUAGE_ENDPOINT}"
: "${AZURE_LANGUAGE_KEY:?Need AZURE_LANGUAGE_KEY}"
: "${CORS_ORIGINS:?Need CORS_ORIGINS}"

set_secret() {
  local name="$1" value="$2"
  az keyvault secret set --vault-name "$VAULT" --name "$name" --value "$value" --output none
  echo "    OK: $name"
}

echo "=== Syncing secrets to $VAULT ==="
set_secret "OPENAI-API-KEY"           "$OPENAI_API_KEY"
set_secret "REDIS-HOST"               "$REDIS_HOST"
set_secret "REDIS-PORT"               "$REDIS_PORT"
set_secret "REDIS-PASSWORD"           "$REDIS_PASSWORD"
set_secret "REDIS-SSL"                "$REDIS_SSL"
set_secret "ELASTIC-ENDPOINT"         "$ELASTIC_ENDPOINT"
set_secret "ELASTIC-API-KEY"          "$ELASTIC_API_KEY"
set_secret "LANGCHAIN-API-KEY"        "$LANGCHAIN_API_KEY"
set_secret "LANGCHAIN-PROJECT"        "$LANGCHAIN_PROJECT"
set_secret "AZURE-LANGUAGE-ENDPOINT"  "$AZURE_LANGUAGE_ENDPOINT"
set_secret "AZURE-LANGUAGE-KEY"       "$AZURE_LANGUAGE_KEY"
set_secret "CORS-ORIGINS"             "$CORS_ORIGINS"
echo "=== Done. Force a new container revision to reload: ==="
echo "    az containerapp update --name governance-backend --resource-group rg-governance-demo --revision-suffix \$(date +%Y%m%d%H%M%S)"
