# Standard Bucket
resource "oci_objectstorage_bucket" "standard" {
  compartment_id = var.compartment_id
  namespace      = var.namespace
  name           = "${var.project_name}-standard"
  access_type    = "NoPublicAccess"

  freeform_tags = merge(var.tags, {
    Tier = "STANDARD"
  })
}

# Archive Bucket
resource "oci_objectstorage_bucket" "archive" {
  compartment_id = var.compartment_id
  namespace      = var.namespace
  name           = "${var.project_name}-archive"
  access_type    = "NoPublicAccess"
  storage_tier   = "Archive"

  freeform_tags = merge(var.tags, {
    Tier = "ARCHIVE"
  })
}

# Terraform State Bucket (for remote state storage)
resource "oci_objectstorage_bucket" "terraform_state" {
  compartment_id = var.compartment_id
  namespace      = var.namespace
  name           = "${var.project_name}-terraform-state"
  access_type    = "NoPublicAccess"
  versioning     = "Enabled"  # Enable versioning for state file safety

  freeform_tags = merge(var.tags, {
    Purpose = "TERRAFORM_STATE"
  })
}
