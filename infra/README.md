# Infrastructure

This directory contains Infrastructure as Code (IaC) for deploying v8id-cloud on Oracle Cloud Infrastructure (OCI).

## Structure

```
infra/
├── terraform/          # Terraform configurations
│   ├── modules/        # Reusable Terraform modules
│   │   ├── network/   # VCN, subnets, gateways
│   │   ├── compute/   # Compute instances
│   │   ├── storage/   # Object Storage buckets
│   │   ├── vault/     # Vault and secrets
│   │   └── iam/       # IAM policies and dynamic groups
│   ├── main.tf         # Provider configuration
│   ├── variables.tf    # Root variables
│   ├── outputs.tf      # Root outputs
│   └── README.md       # Terraform documentation
├── docker/             # Docker Compose for local development
└── README.md           # This file
```

## Quick Start

1. **Configure Terraform variables:**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your OCI credentials
   ```

2. **Initialize and apply:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

See [terraform/README.md](./terraform/README.md) for detailed documentation.

## Resources Created

- **Network**: VCN with public/private subnets, gateways, security lists
- **Compute**: Backend application server (Oracle Linux)
- **Storage**: Two Object Storage buckets (standard and archive tiers)
- **IAM**: Dynamic groups and policies for secure access
- **Vault**: Secrets management (optional)

## Architecture

The infrastructure follows clean architecture principles with modular Terraform code:

- **Network Module**: Isolated VCN with proper routing
- **Compute Module**: Application server with cloud-init
- **Storage Module**: Tier-aware Object Storage buckets
- **IAM Module**: Least-privilege access policies
- **Vault Module**: Centralized secrets management

## Database

The MySQL HeatWave database is external and not managed by this infrastructure. Configure connection via:
- Environment variables on compute instance
- OCI Vault secrets (if vault module enabled)

