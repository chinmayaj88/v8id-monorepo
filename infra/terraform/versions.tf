terraform {
  required_version = ">= 1.12.0"  # 1.12.0+ required for OCI native backend

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }

  # Optional: Uncomment to use Terraform Cloud backend
  # cloud {
  #   organization = "v8id-cloud"
  #   workspaces {
  #     name = "v8id-cloud-prod"
  #   }
  # }

  # OCI Object Storage backend for remote state
  # STEP 1: ✅ Run terraform apply to create the state bucket first - DONE
  # STEP 2: ✅ Uncomment the backend block below - DONE
  # STEP 3: Run terraform init -migrate-state to migrate local state to remote
  #
  # Using OCI native backend (recommended) - uses same credentials as provider
  backend "oci" {
    region    = "ap-mumbai-1"
    bucket    = "v8id-cloud-terraform-state"
    key       = "terraform.tfstate"
    namespace = "bmzcke8ke5xv"
  }
  
  # Alternative: S3-compatible backend (requires customer secret keys)
  # backend "s3" {
  #   bucket                      = "v8id-cloud-terraform-state"
  #   key                         = "terraform.tfstate"
  #   region                      = "ap-mumbai-1"
  #   endpoint                    = "https://bmzcke8ke5xv.compat.objectstorage.ap-mumbai-1.oraclecloud.com"
  #   skip_region_validation      = true
  #   skip_credentials_validation = true
  # }
}
