# Terraform configuration moved to versions.tf

# Provider configuration
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Get compartment
data "oci_identity_compartment" "v8id_cloud" {
  id = var.compartment_id
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Get region info
data "oci_identity_region_subscriptions" "home_region" {
  tenancy_id = var.tenancy_ocid

  filter {
    name   = "is_home_region"
    values = [true]
  }
}

locals {
  region_key = data.oci_identity_region_subscriptions.home_region.region_subscriptions[0].region_key
  ad_names   = data.oci_identity_availability_domains.ads.availability_domains[*].name
}
