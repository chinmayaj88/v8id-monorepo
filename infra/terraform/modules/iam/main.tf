# Dynamic Group for Compute Instances
resource "oci_identity_dynamic_group" "compute_instances" {
  compartment_id = var.tenancy_ocid
  name           = "${var.project_name}-compute-instances"
  description    = "Dynamic group for ${var.project_name} compute instances"
  matching_rule  = "ALL {resource.compartment.id = '${var.compartment_id}'}"
}

# Policy for compute instances to access Object Storage
resource "oci_identity_policy" "compute_storage_access" {
  compartment_id = var.compartment_id
  name           = "${var.project_name}-compute-storage-access"
  description    = "Policy allowing compute instances to access Object Storage buckets"

  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_instances.name} to manage objects in compartment id ${var.compartment_id} where target.bucket.name='${var.standard_bucket_name}'",
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_instances.name} to manage objects in compartment id ${var.compartment_id} where target.bucket.name='${var.archive_bucket_name}'",
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_instances.name} to read buckets in compartment id ${var.compartment_id}",
  ]

  freeform_tags = var.tags
}

# Policy for compute instances to use Vault (if enabled)
resource "oci_identity_policy" "compute_vault_access" {
  count          = var.enable_vault ? 1 : 0
  compartment_id = var.compartment_id
  name           = "${var.project_name}-compute-vault-access"
  description    = "Policy allowing compute instances to read secrets from Vault"

  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_instances.name} to read secret-family in compartment id ${var.compartment_id}",
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_instances.name} to use vaults in compartment id ${var.compartment_id}",
  ]

  freeform_tags = var.tags
}
