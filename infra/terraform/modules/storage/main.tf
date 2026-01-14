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
