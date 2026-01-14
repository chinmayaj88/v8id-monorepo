# CI/CD Workflows

This directory contains GitHub Actions workflows for Continuous Integration (CI) and Continuous Deployment (CD).

## Workflows

### CI (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **lint-and-test**: Lints code and runs tests
2. **build-backend**: Builds TypeScript backend
3. **docker-build**: Builds and pushes Docker image

**Image Registry:**
- Docker Hub

### CD (`cd.yml`)

**Triggers:**
- After successful CI pipeline completion
- Manual trigger via GitHub Actions UI

**Jobs:**
1. **deploy-backend**: Deploys to OCI compute instance
   - Builds and pushes Docker image
   - Connects to compute instance via SSH
   - Runs database migrations
   - Deploys new container
   - Performs health check

## Setup

See [CD_SETUP.md](./CD_SETUP.md) for detailed setup instructions.

## Required Secrets

### Docker Hub
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_TOKEN`

### Compute Instance
- `OCI_COMPUTE_IP`
- `OCI_COMPUTE_SSH_USER`
- `OCI_COMPUTE_SSH_PRIVATE_KEY`

### Docker Hub (fallback)
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_TOKEN`

## Workflow Status

Check workflow status:
- GitHub Repository > Actions tab
- View workflow runs and logs
- Monitor deployment status

## Troubleshooting

### CI Fails
- Check lint errors
- Verify tests pass
- Check build logs

### CD Fails
- Verify OCI credentials
- Check SSH access to compute instance
- Verify Container Registry access
- Check deployment logs

See [CD_SETUP.md](./CD_SETUP.md) for detailed troubleshooting.
