# Terraform Remote State Setup

This guide explains how to set up remote state storage in OCI Object Storage to prevent state loss.

## Prerequisites

- **Terraform version 1.12.0 or later** (required for OCI native backend)
- An existing OCI Object Storage bucket (created automatically by Terraform)
- OCI API key credentials (same as used for provider)

## Why Remote State?

- **State Safety**: Prevents loss of Terraform state if local files are deleted
- **Team Collaboration**: Multiple team members can work with the same state
- **State Locking**: Prevents concurrent modifications
- **Versioning**: State bucket has versioning enabled for recovery

## Setup Steps

### Step 1: Create Infrastructure (First Time)

The state bucket will be created automatically when you run:

```bash
cd infra/terraform
terraform init
terraform apply
```

This creates the `v8id-cloud-terraform-state` bucket.

### Step 2: Enable Remote Backend

After the bucket is created, uncomment the backend block in `versions.tf`:

**Option 1: OCI Native Backend (Recommended - uses same credentials as provider)**
```hcl
backend "oci" {
  region   = "ap-mumbai-1"
  bucket   = "v8id-cloud-terraform-state"
  key      = "terraform.tfstate"
  namespace = "bmzcke8ke5xv"
}
```

**Option 2: S3-Compatible Backend (requires customer secret keys)**
```hcl
backend "s3" {
  bucket                      = "v8id-cloud-terraform-state"
  key                         = "terraform.tfstate"
  region                      = "ap-mumbai-1"
  endpoint                    = "https://bmzcke8ke5xv.compat.objectstorage.ap-mumbai-1.oraclecloud.com"
  skip_region_validation      = true
  skip_credentials_validation = true
}
```

**Note**: OCI native backend is recommended as it uses the same API key credentials you're already using.

### Step 3: Migrate Local State to Remote

Run this command to migrate your existing local state to the remote backend:

```bash
terraform init -migrate-state
```

Terraform will ask if you want to migrate the existing state. Type `yes`.

### Step 4: Verify

Check that state is now stored remotely:

```bash
terraform state list
```

You should see your resources listed. The state is now stored in OCI Object Storage.

## Backend Configuration Details

- **Bucket**: `v8id-cloud-terraform-state` (created automatically)
- **State File**: `terraform.tfstate`
- **Region**: `ap-mumbai-1`
- **Versioning**: Enabled (allows state recovery)
- **Access**: Private (NoPublicAccess)

## State Bucket Location

The state bucket is created in the same compartment as your other resources and uses the same namespace.

## Troubleshooting

### Error: "Backend configuration changed"

If you see this error, you need to migrate state:
```bash
terraform init -migrate-state
```

### Error: "Bucket not found"

Make sure you've run `terraform apply` at least once to create the state bucket before enabling the backend.

### State Lock Issues

If Terraform crashes, you may need to manually remove the state lock:
```bash
# Check for locks in OCI Console > Object Storage > Bucket > terraform.tfstate.tflock
# Or use OCI CLI to delete the lock file
```

## Security Notes

- State bucket is private (NoPublicAccess)
- State file contains sensitive information - keep it secure
- Versioning is enabled for recovery
- Use IAM policies to restrict access to the state bucket
