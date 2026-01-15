#!/bin/bash
# Setup script for compute instance
# One-time VM bootstrap for v8id-cloud

set -e

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
}

# ----------------------------
# App directory
# ----------------------------
log_info "Creating application directory..."
sudo mkdir -p /opt/v8id-cloud
sudo chown $USER:$USER /opt/v8id-cloud

# ----------------------------
# Docker install
# ----------------------------
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release jq
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
          https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
          | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y dnf-utils jq
        sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
else
    log_info "Docker already installed"
fi

# ----------------------------
# OCI CLI install
# ----------------------------
if ! command -v oci &> /dev/null; then
    log_info "Installing OCI CLI..."
    bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults
    # Add to path for current session
    export PATH=$PATH:$HOME/bin
else
    log_info "OCI CLI already installed"
fi

# ----------------------------
# INSTALL NGINX
# ----------------------------
if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y nginx
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y nginx
    fi
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    log_info "Nginx already installed"
fi

# ----------------------------
# NGINX REVERSE PROXY (80 → 4000)
# ----------------------------
log_info "Configuring Nginx reverse proxy..."

sudo tee /etc/nginx/sites-available/v8id-cloud > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/v8id-cloud /etc/nginx/sites-enabled/v8id-cloud

# Test & reload
sudo nginx -t
sudo systemctl reload nginx

log_info "Nginx reverse proxy enabled (80 → localhost:4000)"

# ----------------------------
# FIREWALL (UFW)
# ----------------------------
if command -v ufw &> /dev/null; then
    log_info "Configuring UFW firewall..."
    sudo ufw allow OpenSSH
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw --force enable
else
    log_info "UFW not installed, skipping firewall rules"
fi

# ----------------------------
# Vault scripts placeholder
# ----------------------------
mkdir -p /opt/v8id-cloud/scripts

log_info "Setup completed!"
log_info "Backend will be accessible at: http://<VM_PUBLIC_IP>"
log_info "Docker backend must listen on port 4000"
