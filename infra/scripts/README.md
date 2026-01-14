# Deployment Scripts

Scripts for deploying and managing v8id-cloud backend on OCI compute instances.

## Scripts

### `deploy.sh`

Main deployment script that:
- Pulls latest Docker image from OCI Container Registry
- Stops and removes old container
- Runs database migrations
- Starts new container
- Performs health check

**Usage:**
```bash
export COMPUTE_IP="your-compute-ip"
export DOCKER_HUB_USERNAME="your-dockerhub-username"
export DOCKER_HUB_TOKEN="your-dockerhub-token"
export IMAGE_NAME="your-dockerhub-username/v8id-cloud-backend"
export IMAGE_TAG="latest"
export SSH_USER="opc"
export SSH_KEY="~/.ssh/id_rsa"
export VAULT_OCID="ocid1.vault.oc1..aaaaaaa..."  # OCI Vault OCID

./infra/scripts/deploy.sh
```

**Environment Variables:**
- `COMPUTE_IP`: OCI compute instance IP address (required)
- `DOCKER_HUB_USERNAME`: Docker Hub username (required)
- `DOCKER_HUB_TOKEN`: Docker Hub access token (required)
- `IMAGE_NAME`: Full image name (e.g., `username/v8id-cloud-backend`) (required)
- `IMAGE_TAG`: Image tag (default: `latest`)
- `SSH_USER`: SSH user (default: `opc`)
- `SSH_KEY`: Path to SSH private key (default: `~/.ssh/id_rsa`)
- `ENV_FILE`: Path to .env file on compute instance (default: `/opt/v8id-cloud/.env`)
- `VAULT_OCID`: OCI Vault OCID for fetching secrets (required for Vault-based deployment)

### `setup-compute.sh`

Initial setup script for compute instance. Run this once on a new compute instance.

**Usage:**
```bash
# Copy to compute instance
scp infra/scripts/setup-compute.sh opc@your-compute-ip:~/

# SSH to compute instance
ssh opc@your-compute-ip

# Run setup
chmod +x setup-compute.sh
./setup-compute.sh
```

**What it does:**
- Creates `/opt/v8id-cloud` directory
- Creates `.env.template` file
- Creates systemd service template (optional)
- Installs Docker (if not present)
- Sets up deployment directory

## Manual Deployment

If you prefer to deploy manually:

```bash
# SSH to compute instance
ssh opc@your-compute-ip

# Login to Docker Hub
echo "YOUR_DOCKER_HUB_TOKEN" | docker login -u 'your-dockerhub-username' --password-stdin

# Pull latest image
docker pull your-dockerhub-username/v8id-cloud-backend:latest

# Stop old container
docker stop v8id-backend || true
docker rm v8id-backend || true

# Run migrations
docker run --rm \
  --env-file /opt/v8id-cloud/.env \
  your-dockerhub-username/v8id-cloud-backend:latest \
  pnpm prisma migrate deploy

# Start new container
docker run -d \
  --name v8id-backend \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file /opt/v8id-cloud/.env \
  your-dockerhub-username/v8id-cloud-backend:latest

# Check logs
docker logs -f v8id-backend

# Health check
curl http://localhost:4000/health
```

## CI/CD Integration

The deployment script is integrated into GitHub Actions workflow (`.github/workflows/cd-backend.yml`).

The workflow:
1. Builds Docker image
2. Pushes to OCI Container Registry
3. Runs `deploy.sh` via SSH
4. Performs health check

## Troubleshooting

### SSH Connection Issues

**Error: "Permission denied (publickey)"**
- Ensure SSH key is added to compute instance
- Check key permissions: `chmod 600 ~/.ssh/id_rsa`
- Verify key is in `~/.ssh/authorized_keys` on compute instance

### Docker Login Issues

**Error: "unauthorized: authentication required"**
- Verify Docker Hub token is valid
- Check username is correct
- Ensure token has repository access
- Use access token, not password

### Container Won't Start

**Check logs:**
```bash
docker logs v8id-backend
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port already in use
- Invalid .env file

### Health Check Fails

**Check service:**
```bash
curl http://localhost:4000/health
docker ps
docker logs v8id-backend
```

**Common issues:**
- Application not started
- Port not exposed
- Health endpoint not responding
- Database connection issues

## Security Notes

- Never commit `.env` files
- Use OCI Vault for secrets in production
- Rotate OCI auth tokens regularly
- Use SSH keys, not passwords
- Restrict SSH access via security lists

## Next Steps

1. Set up OCI Container Registry
2. Configure GitHub Secrets
3. Run `setup-compute.sh` on compute instance
4. Configure `.env` file
5. Test deployment manually
6. Enable CI/CD pipeline
