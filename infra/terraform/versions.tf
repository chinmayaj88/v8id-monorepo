terraform {
  required_version = ">= 1.6.0"

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

  # Alternative: Use OCI Object Storage as backend
  # backend "s3" {
  #   bucket   = "terraform-state"
  #   key      = "v8id-cloud/terraform.tfstate"
  #   region   = "us-ashburn-1"
  #   endpoint = "https://<namespace>.compat.objectstorage.<region>.oraclecloud.com"
  #   skip_region_validation      = true
  #   skip_credentials_validation = true
  # }
}
