#!/bin/bash
# Deployment script for v8id-cloud backend
# This script can be run manually or via CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPUTE_IP="${COMPUTE_IP:-}"
SSH_USER="${SSH_USER:-opc}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
ENV_FILE="${ENV_FILE:-/opt/v8id-cloud/.env}"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-}"
DOCKER_HUB_TOKEN="${DOCKER_HUB_TOKEN:-}"
IMAGE_NAME="${IMAGE_NAME:-}"
VAULT_OCID="${VAULT_OCID:-}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if [ -z "$COMPUTE_IP" ]; then
        log_error "COMPUTE_IP environment variable is required"
        exit 1
    fi
    
    if [ -z "$DOCKER_HUB_USERNAME" ]; then
        log_error "DOCKER_HUB_USERNAME environment variable is required"
        exit 1
    fi
    
    if [ -z "$DOCKER_HUB_TOKEN" ]; then
        log_error "DOCKER_HUB_TOKEN environment variable is required"
        exit 1
    fi
    
    if [ -z "$IMAGE_NAME" ]; then
        log_error "IMAGE_NAME environment variable is required"
        exit 1
    fi
    
    if [ -z "$VAULT_OCID" ]; then
        log_warn "VAULT_OCID not set. Secrets will not be fetched from Vault."
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found: $SSH_KEY"
        exit 1
    fi
    
    log_info "All requirements met"
}

deploy() {
    log_info "Starting deployment..."
    log_info "Image: $IMAGE_NAME:$IMAGE_TAG"
    log_info "Target: $SSH_USER@$COMPUTE_IP"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$COMPUTE_IP" << EOF
        set -e
        
        # Export Vault OCID for secret fetching
        export VAULT_OCID="$VAULT_OCID"
        export ENV_FILE="$ENV_FILE"
        export PROJECT_NAME="v8id-cloud"
        
        # Fetch secrets from Vault
        echo "[INFO] Fetching secrets from OCI Vault..."
        if [ -f /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh ]; then
          chmod +x /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh
          /opt/v8id-cloud/scripts/fetch-secrets-from-vault.sh || echo "[WARN] Failed to fetch from Vault, using existing .env if present"
        else
          echo "[WARN] Vault fetch script not found, using existing .env file"
        fi
        
        # Verify .env file exists
        if [ ! -f "$ENV_FILE" ]; then
          echo "[ERROR] .env file not found. Please create it manually or ensure Vault secrets are configured."
          exit 1
        fi
        
        echo "[INFO] Logging in to Docker Hub..."
        echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
        
        echo "[INFO] Pulling latest image..."
        docker pull $IMAGE_NAME:$IMAGE_TAG
        
        echo "[INFO] Stopping old container..."
        docker stop v8id-backend 2>/dev/null || true
        docker rm v8id-backend 2>/dev/null || true
        
        echo "[INFO] Running database migrations..."
        docker run --rm \\
          --env-file $ENV_FILE \\
          $IMAGE_NAME:$IMAGE_TAG \\
          pnpm prisma migrate deploy || echo "[WARN] Migration failed or no migrations to run"
        
        echo "[INFO] Starting new container..."
        docker run -d \\
          --name v8id-backend \\
          --restart unless-stopped \\
          -p 4000:4000 \\
          --env-file $ENV_FILE \\
          $IMAGE_NAME:$IMAGE_TAG
        
        echo "[INFO] Cleaning up old images..."
        docker image prune -af --filter "until=24h" || true
        
        echo "[INFO] Deployment completed"
EOF
    
    log_info "Deployment script executed successfully"
}

health_check() {
    log_info "Performing health check..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://$COMPUTE_IP:4000/health" > /dev/null 2>&1; then
            log_info "✅ Health check passed"
            return 0
        fi
        
        echo "[INFO] Waiting for service to be healthy... ($attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "❌ Health check failed after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    log_info "v8id-cloud Backend Deployment Script"
    log_info "====================================="
    
    check_requirements
    deploy
    
    if health_check; then
        log_info "✅ Deployment successful"
        exit 0
    else
        log_error "❌ Deployment failed health check"
        exit 1
    fi
}

# Run main function
main "$@"
