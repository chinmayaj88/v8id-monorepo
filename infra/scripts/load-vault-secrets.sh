#!/bin/bash

###############################################################################
# OCI Vault Secret Loader
#
# This script loads secrets from OCI Vault and exports them as environment
# variables for the application container.
#
# Usage:
#   1. Run this script before starting the application
#   2. Source the output to set environment variables:
#      source ./load-vault-secrets.sh
#
# Requirements:
#   - OCI CLI installed and configured
#   - Instance principal or API key authentication configured
#   - Access to OCI Vault and secrets
##############################################################################

set -euo pipefail

# Configuration
COMPARTMENT_ID="${OCI_COMPARTMENT_ID:? \"OCI_COMPARTMENT_ID environment variable is required\"}"
VAULT_ID="${OCI_VAULT_ID:? \"OCI_VAULT_ID environment variable is required\"}"
SECRET_PREFIX="v8id-cloud-"

# Authentication Method
# If OCI_AUTH is set, use it. Otherwise, if OCI_TENANCY_ID is not set, default to instance_principal.
AUTH_METHOD="${OCI_AUTH:-}"
if [ -z "$AUTH_METHOD" ]; then
  if [ -z "${OCI_TENANCY_ID:-}" ]; then
    AUTH_METHOD="instance_principal"
  else
    AUTH_METHOD="api_key"
  fi
fi

echo "🔐 Loading secrets from OCI Vault..." >&2
echo "Compartment ID: $COMPARTMENT_ID" >&2
echo "Vault ID: $VAULT_ID" >&2
echo "Auth Method: $AUTH_METHOD" >&2

AUTH_FLAG=""
if [ "$AUTH_METHOD" == "instance_principal" ]; then
  AUTH_FLAG="--auth instance_principal"
fi

# List all secrets in the vault
secrets=$(oci vault secret list \
  $AUTH_FLAG \
  --compartment-id "$COMPARTMENT_ID" \
  --vault-id "$VAULT_ID" \
  --all \
  --query 'data[].{id:id,name:"secret-name",state:"lifecycle-state"}' \
  --output json)

# Check if we got any secrets
if [ -z "$secrets" ] || [ "$(echo "$secrets" | jq '. | length')" -eq 0 ]; then
  echo "⚠️  Warning: No secrets found in vault" >&2
  exit 0
fi

# Process each secret
echo "$secrets" | jq -c '.[]' | while read -r secret; do
  secret_id=$(echo "$secret" | jq -r '.id')
  secret_name=$(echo "$secret" | jq -r '.name')
  secret_state=$(echo "$secret" | jq -r '.state')
  
  # Skip if not ACTIVE
  if [ "$secret_state" != "ACTIVE" ]; then
    continue
  fi
  
  # Skip if doesn't match our prefix
  if [[ ! "$secret_name" =~ ^${SECRET_PREFIX} ]]; then
    continue
  fi
  
  # Extract environment variable name (remove prefix)
  env_var_name="${secret_name#$SECRET_PREFIX}"
  
  echo "  📦 Loading: $env_var_name" >&2
  
  # Get secret value
  secret_value=$(oci secrets secret-bundle get \
    $AUTH_FLAG \
    --secret-id "$secret_id" \
    --query 'data."secret-bundle-content".content' \
    --raw-output | base64 -d)
  
  # Export the environment variable
  export "$env_var_name=$secret_value"
  
  # Output in KEY=VALUE format for Docker --env-file compatibility
  # DO NOT use quotes here, as Docker reads them literally into the variable value.
  echo "$env_var_name=$secret_value"
done

echo "✅ Successfully loaded secrets from OCI Vault" >&2
