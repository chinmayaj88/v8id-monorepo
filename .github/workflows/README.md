# CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### `ci.yml` - Continuous Integration

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
1. **Lint and Test** - Runs linting and tests
2. **Build Backend** - Builds the backend application
3. **Docker Build** - Builds and pushes Docker image to Docker Hub (only on push to main/develop)

### `cd.yml` - Continuous Deployment

Runs on pushes to `main` branch or when tags starting with `v` are created.

**Jobs:**
1. **Deploy to OCI** - Deploys the application to Oracle Cloud Infrastructure

## Required Secrets

Configure these secrets in your GitHub repository settings:

### CI Secrets
- `DATABASE_URL` - Database connection string for Prisma migrations
- `DOCKER_HUB_USERNAME` - Docker Hub username
- `DOCKER_HUB_TOKEN` - Docker Hub access token

### CD Secrets
- `PRODUCTION_DATABASE_URL` - Production database connection string
- `OCI_CREDENTIALS` - OCI authentication credentials (JSON format)

## Setup Instructions

1. **Create Docker Hub Account** (if not already created)
   - Go to https://hub.docker.com
   - Create a public repository: `v8id-cloud-backend`

2. **Generate Docker Hub Access Token**
   - Go to Docker Hub → Account Settings → Security
   - Create a new access token
   - Add it as `DOCKER_HUB_TOKEN` secret in GitHub

3. **Add GitHub Secrets**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add all required secrets listed above

4. **Configure OCI Credentials** (for deployment)
   - Create OCI API key
   - Add credentials as JSON in `OCI_CREDENTIALS` secret

## Workflow Triggers

- **CI**: Runs on every push/PR to main/develop
- **CD**: Runs only on push to main branch or version tags

## Cost

All workflows use GitHub Actions free tier (2000 minutes/month for public repositories).

## Future: CD Pipeline

A robust CD pipeline with automated migrations is planned for future implementation. See `CD_PLAN.md` for detailed architecture and safety features.

**Planned Features:**
- Automated staging deployments
- Production deployments with approval gates
- Safe database migrations with auto-rollback
- Blue-green deployment strategy
- Comprehensive monitoring and alerts

