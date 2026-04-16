#!/usr/bin/env bash
# provision.sh — Create all Azure infrastructure for governance-demo from scratch.
# Run once per environment. Idempotent where possible.
#
# Prerequisites:
#   az login (as info@truos.io or account with Owner on subscription)
#   Docker installed and running
#
# Usage:
#   chmod +x infra/provision.sh
#   ./infra/provision.sh

set -euo pipefail

SUBSCRIPTION="a022ff24-58dd-48b0-a8b5-0791dbdb06e6"
RESOURCE_GROUP="rg-governance-demo"
LOCATION="eastus"

ACR_NAME="governancedemoacr"
REDIS_NAME="governance-redis"
KEYVAULT_NAME="gov-demo-kv-truos"
CONTAINERAPP_ENV="governance-env"
CONTAINERAPP_NAME="governance-backend"
STATICWEBAPP_NAME="governance-frontend"
BACKEND_IMAGE="$ACR_NAME.azurecr.io/governance-backend:latest"

az account set --subscription "$SUBSCRIPTION"

echo "=== 1. Resource Group ==="
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
echo "    OK: $RESOURCE_GROUP"

echo "=== 2. Container Registry ==="
az acr create \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Basic \
  --admin-enabled true \
  --output none
echo "    OK: $ACR_NAME.azurecr.io"

echo "=== 3. Azure Cache for Redis (Basic C0, Redis 6) ==="
az redis create \
  --name "$REDIS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Basic \
  --vm-size c0 \
  --redis-version 6 \
  --enable-non-ssl-port false \
  --output none
echo "    OK: $REDIS_NAME (provisioning takes ~15 min, continue)"

echo "=== 4. Key Vault (RBAC mode) ==="
az keyvault create \
  --name "$KEYVAULT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --enable-rbac-authorization true \
  --enable-soft-delete true \
  --output none

DEPLOYER_OID=$(az ad signed-in-user show --query id -o tsv)
SUBSCRIPTION_SCOPE="/subscriptions/$SUBSCRIPTION"
KV_SCOPE="$SUBSCRIPTION_SCOPE/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEYVAULT_NAME"

az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee-object-id "$DEPLOYER_OID" \
  --assignee-principal-type User \
  --scope "$KV_SCOPE" \
  --output none
echo "    OK: $KEYVAULT_NAME"

echo "=== 5. Container Apps Environment ==="
az containerapp env create \
  --name "$CONTAINERAPP_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "    OK: $CONTAINERAPP_ENV"

echo "=== 6. Push initial Docker image ==="
az acr login --name "$ACR_NAME"
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" .
docker push "$BACKEND_IMAGE"
echo "    OK: image pushed"

echo "=== 7. Container App (backend) ==="
# Secrets are populated separately by scripts/keyvault-sync.sh.
# Run keyvault-sync.sh BEFORE this step so Key Vault has all secrets.
az containerapp create \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINERAPP_ENV" \
  --image "$BACKEND_IMAGE" \
  --target-port 80 \
  --ingress external \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --system-assigned \
  --registry-server "$ACR_NAME.azurecr.io" \
  --output none

CONTAINERAPP_PRINCIPAL=$(az containerapp show \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "identity.principalId" -o tsv)

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee-object-id "$CONTAINERAPP_PRINCIPAL" \
  --assignee-principal-type ServicePrincipal \
  --scope "$KV_SCOPE" \
  --output none
echo "    OK: $CONTAINERAPP_NAME (system identity granted KV access)"

echo ""
echo "=== NEXT STEPS ==="
echo "1. Run: ./scripts/keyvault-sync.sh  (populate all secrets)"
echo "2. Run: ./scripts/configure-containerapp.sh  (wire KV secrets to env vars)"
echo "3. Build and push frontend:"
echo "   cd frontend && npm ci && npm run build"
echo "   az staticwebapp create --name $STATICWEBAPP_NAME --resource-group $RESOURCE_GROUP --location eastus2 --sku Free"
echo "4. Re-index Elasticsearch:"
echo "   python src/elastic_indexer.py"
echo "5. Set GitHub Actions secrets (see scripts/github-secrets.txt)"
