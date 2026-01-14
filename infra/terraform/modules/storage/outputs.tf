output "standard_bucket_name" {
  description = "Standard bucket name"
  value       = oci_objectstorage_bucket.standard.name
}

output "archive_bucket_name" {
  description = "Archive bucket name"
  value       = oci_objectstorage_bucket.archive.name
}

output "standard_bucket_namespace" {
  description = "Object Storage namespace"
  value       = var.namespace
}

output "archive_bucket_namespace" {
  description = "Object Storage namespace"
  value       = var.namespace
}
