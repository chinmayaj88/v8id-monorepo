#!/bin/bash
# Setup script for compute instance
# Run this once on the compute instance to prepare it for deployments

set -e

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
}

# Create application directory
log_info "Creating application directory..."
sudo mkdir -p /opt/v8id-cloud
sudo chown $USER:$USER /opt/v8id-cloud

# Create .env file template
log_info "Creating .env file template..."
cat > /opt/v8id-cloud/.env.template << 'EOF'
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
DATABASE_URL=mysql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# TOTP Configuration
TOTP_ENCRYPTION_KEY=your-secure-totp-encryption-key-minimum-32-characters
TOTP_ISSUER=v8id-cloud

# Email Configuration
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# OCI Configuration
OCI_OBJECT_STORAGE_NAMESPACE=your-namespace
OCI_OBJECT_STORAGE_BUCKET_NAME_STANDARD=v8id-cloud-standard
OCI_OBJECT_STORAGE_BUCKET_NAME_ARCHIVE=v8id-cloud-archive
OCI_REGION=us-ashburn-1

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Security
TRUST_PROXY=false
BCRYPT_ROUNDS=12
EOF

log_info ".env template created at /opt/v8id-cloud/.env.template"
log_info "Please copy and edit: cp /opt/v8id-cloud/.env.template /opt/v8id-cloud/.env"

# Create systemd service (optional, for non-Docker deployment)
log_info "Creating systemd service template..."
sudo tee /etc/systemd/system/v8id-backend.service > /dev/null << 'EOF'
[Unit]
Description=v8id-cloud Backend API
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/v8id-cloud
EnvironmentFile=/opt/v8id-cloud/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

log_info "Systemd service template created (disabled by default)"
log_info "To enable: sudo systemctl enable v8id-backend"

# Setup Docker (if not already installed)
if ! command -v docker &> /dev/null; then
    log_info "Docker not found. Installing Docker..."
    # Install Docker for Ubuntu
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    log_info "Docker installed. Please log out and back in for group changes to take effect."
else
    log_info "Docker is already installed"
fi

# Create deployment directory
log_info "Creating deployment scripts directory..."
mkdir -p /opt/v8id-cloud/scripts

# Copy Vault fetch script
log_info "Setting up Vault secret fetching script..."
cat > /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh << 'SCRIPT_EOF'
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
        echo "$SECRET_BUNDLE" | base64 -d >> "$ENV_FILE"
        echo "" >> "$ENV_FILE"  # Add newline
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
SCRIPT_EOF

chmod +x /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh
log_info "Vault fetch script created at /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh"

log_info "Setup completed!"
log_info "Next steps:"
log_info "1. Copy .env.template to .env and fill in your values"
log_info "2. Ensure Docker is running: sudo systemctl status docker"
log_info "3. Test deployment with: ./infra/scripts/deploy.sh"
