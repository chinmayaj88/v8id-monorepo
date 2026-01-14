# v8id-cloud Infrastructure as Code

Terraform configuration for deploying v8id-cloud backend on Oracle Cloud Infrastructure (OCI).

## Architecture

This infrastructure creates:

- **VCN (Virtual Cloud Network)**: Isolated network with public and private subnets
- **Compute Instance**: Backend application server (Oracle Linux)
- **Object Storage Buckets**: 
  - `v8id-cloud-standard`: Standard tier storage
  - `v8id-cloud-archive`: Archive tier storage
- **Vault** (optional): Secrets management
- **IAM Policies**: Dynamic groups and policies for compute-to-storage access

## Prerequisites

1. **OCI Account**: Active Oracle Cloud Infrastructure account
2. **Compartment**: Existing compartment named "v8id-cloud" (or update `compartment_id`)
3. **API Key**: OCI API key pair generated and configured
4. **Terraform**: Version >= 1.6.0
5. **OCI Provider**: Terraform OCI provider ~> 5.0

## Setup

### 1. Configure OCI API Key

```bash
# Generate API key pair
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Upload public key to OCI Console
# User Settings > API Keys > Add API Key
```

### 2. Get Required OCIDs

- **Tenancy OCID**: OCI Console > Administration > Tenancy Details
- **User OCID**: OCI Console > Identity > Users > Your User
- **Compartment OCID**: OCI Console > Identity > Compartments > v8id-cloud
- **Namespace**: OCI Console > Object Storage > Bucket Details (shown in URL)

### 3. Configure Terraform

```bash
cd infra/terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
# - tenancy_ocid
# - user_ocid
# - fingerprint (from uploaded public key)
# - private_key_path
# - compartment_id
# - namespace
# - ssh_public_key
```

### 4. Initialize Terraform

```bash
terraform init
```

### 5. Plan and Apply

```bash
# Review changes
terraform plan

# Apply infrastructure
terraform apply
```

## Module Structure

Following clean architecture principles:

```
terraform/
├── main.tf              # Provider and data sources
├── variables.tf         # Root variables
├── outputs.tf          # Root outputs
├── vcn.tf              # Network module
├── compute.tf          # Compute module
├── storage.tf          # Storage module
├── vault.tf            # Vault module (optional)
├── iam.tf              # IAM module
└── modules/
    ├── network/        # VCN, subnets, gateways, security lists
    ├── compute/        # Compute instance, block volumes
    ├── storage/        # Object Storage buckets
    ├── vault/          # Vault and encryption keys
    └── iam/            # Dynamic groups and policies
```

## Resources Created

### Network
- 1 VCN (10.0.0.0/16)
- 1 Public Subnet (10.0.1.0/24)
- 1 Private Subnet (10.0.2.0/24)
- 1 Internet Gateway
- 1 NAT Gateway
- 1 Service Gateway
- 2 Route Tables (public, private)
- 2 Security Lists (public, private)

### Compute
- 1 Compute Instance (VM.Standard.E2.1.Micro - Always Free, 1 OCPU, 1GB RAM)
  - OS: Canonical Ubuntu 22.04 Minimal
  - Up to 2 instances free per tenancy
- No Block Volume (using Object Storage instead for Always Free tier)
- Cloud-init script for Docker, Node.js 22, pnpm

### Storage
- 1 Standard Bucket (`v8id-cloud-standard`) - default settings
- 1 Archive Bucket (`v8id-cloud-archive`) - default settings

### IAM
- 1 Dynamic Group (compute instances)
- 1 Policy (compute to Object Storage access)
- 1 Policy (compute to Vault access, if enabled)

### Vault (optional)
- 1 Vault
- 1 Master Encryption Key
- 1 Secret (database credentials example)

## Outputs

After applying, Terraform outputs:

- `vcn_id`: VCN OCID
- `compute_instance_id`: Compute instance OCID
- `compute_private_ip`: Compute instance private IP
- `standard_bucket_name`: Standard bucket name
- `archive_bucket_name`: Archive bucket name
- `namespace`: Object Storage namespace
- `vault_id`: Vault OCID (if enabled)

## Accessing the Compute Instance

The compute instance is in a private subnet. Access via:

1. **Bastion Host** (recommended): Create a bastion host in public subnet
2. **VPN**: Connect via VPN to VCN
3. **SSH Port Forwarding**: Through a jump host

## Database Connection

The MySQL HeatWave database is external. Configure connection via:

1. **Vault Secret**: Store credentials in OCI Vault (if enabled)
2. **Environment Variables**: Set `DATABASE_URL` on compute instance
3. **Private Endpoint**: If database has private endpoint, ensure routing

## Object Storage Configuration

The backend uses instance principal authentication (via dynamic group). No API keys needed.

Environment variables for backend:
```env
OCI_OBJECT_STORAGE_NAMESPACE=<namespace>
OCI_OBJECT_STORAGE_BUCKET_NAME_STANDARD=v8id-cloud-standard
OCI_OBJECT_STORAGE_BUCKET_NAME_ARCHIVE=v8id-cloud-archive
```

## Security Notes

- Compute instance in private subnet (no direct internet access)
- Object Storage buckets: NoPublicAccess
- Security lists restrict traffic
- IAM policies follow least privilege
- Vault for secrets management (optional but recommended)

## Always Free Resources

This configuration uses OCI Always Free tier resources:

- **Compute**: `VM.Standard.A1.Flex` (ARM processor)
  - 4 OCPUs and 24GB RAM free (first 3000 OCPU hours/month)
  - Alternative: `VM.Standard.E2.1.Micro` (1 OCPU, 1GB) - up to 2 instances
- **Object Storage**: 10GB free storage
- **Block Volume**: Not included (use Object Storage instead)
- **Networking**: VCN, subnets, gateways are free

## Troubleshooting

### Terraform Errors

**Error: "Compartment not found"**
- Verify `compartment_id` in `terraform.tfvars`
- Ensure compartment exists and you have access

**Error: "Invalid fingerprint"**
- Verify fingerprint matches uploaded public key
- Check key format (should be colon-separated hex)

**Error: "Namespace not found"**
- Get namespace from OCI Console > Object Storage
- It's shown in bucket URLs: `https://objectstorage.<region>.oraclecloud.com/n/<namespace>/b/<bucket>/o/`

### Compute Instance Issues

**Can't SSH to instance**
- Instance is in private subnet (no public IP)
- Use bastion host or VPN
- Check security list rules

**Application can't access Object Storage**
- Verify dynamic group includes instance
- Check IAM policies are applied
- Verify bucket names match

## Next Steps

1. **Deploy Backend**: Build Docker image and deploy to compute instance
2. **Configure Database**: Set up connection to MySQL HeatWave
3. **Set Up Monitoring**: Configure OCI Monitoring and Alarms
4. **Set Up Logging**: Configure OCI Logging
5. **CD Pipeline**: Create CI/CD pipeline for automated deployments

## References

- [OCI Terraform Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Terraform Best Practices](https://www.terraform.io/docs/language/modules/develop/index.html)
