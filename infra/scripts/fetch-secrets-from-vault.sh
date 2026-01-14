#!/bin/bash
# Fetch secrets from OCI Vault and create .env file
# This script runs on the compute instance using instance principal authentication

set -e

# Configuration
VAULT_OCID="${VAULT_OCID:-}"
ENV_FILE="${ENV_FILE:-/opt/v8id-cloud/.env}"
PROJECT_NAME="${PROJECT_NAME:-v8id-cloud}"

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
}

if [ -z "$VAULT_OCID" ]; then
    log_error "VAULT_OCID environment variable is required"
    exit 1
fi

log_info "Fetching secrets from OCI Vault: $VAULT_OCID"

# Install OCI CLI if not present
if ! command -v oci &> /dev/null; then
    log_info "Installing OCI CLI..."
    bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults --quiet
    export PATH=$PATH:~/.local/bin
fi

# Use instance principal authentication (no API keys needed)
export OCI_CLI_AUTH=instance_principal

# Create .env file
> "$ENV_FILE"

# Fetch secrets from Vault
# Note: Secret names should follow pattern: ${PROJECT_NAME}-{secret-name}

log_info "Fetching secrets from Vault..."

# List all secrets in the vault
SECRETS=$(oci vault secret list \
    --vault-id "$VAULT_OCID" \
    --query 'data[*].id' \
    --raw-output 2>/dev/null || echo "")

if [ -z "$SECRETS" ]; then
    log_error "No secrets found in Vault or unable to access Vault"
    log_info "Creating .env file with non-sensitive defaults..."
    cat > "$ENV_FILE" << EOF
# Non-sensitive configuration (secrets should be in Vault)
PORT=4000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
BCRYPT_ROUNDS=12
TOTP_ISSUER=v8id-cloud
EOF
    exit 0
fi

# Fetch each secret and add to .env file
for secret_ocid in $SECRETS; do
    log_info "Fetching secret: $secret_ocid"
    
    # Get secret bundle (decrypted)
    SECRET_BUNDLE=$(oci vault secret get-secret-bundle \
        --secret-id "$secret_ocid" \
        --query 'data."secret-bundle-content".content' \
        --raw-output 2>/dev/null)
    
    if [ -n "$SECRET_BUNDLE" ]; then
        # Decode base64 and append to .env file
        DECODED=$(echo "$SECRET_BUNDLE" | base64 -d)
        echo "$DECODED" >> "$ENV_FILE"
        echo "" >> "$ENV_FILE"  # Add newline between secrets
    fi
done

# Add non-sensitive defaults if not present
if ! grep -q "PORT=" "$ENV_FILE"; then
    cat >> "$ENV_FILE" << EOF
# Non-sensitive defaults
PORT=4000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
BCRYPT_ROUNDS=12
TOTP_ISSUER=v8id-cloud
EOF
fi

chmod 600 "$ENV_FILE"
log_info "Secrets fetched and saved to $ENV_FILE"
