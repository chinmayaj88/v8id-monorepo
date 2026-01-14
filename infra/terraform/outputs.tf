output "vcn_id" {
  description = "VCN OCID"
  value       = module.network.vcn_id
}

output "compute_instance_id" {
  description = "Compute instance OCID"
  value       = module.compute.instance_id
}

output "compute_private_ip" {
  description = "Compute instance private IP"
  value       = module.compute.instance_private_ip
}

output "standard_bucket_name" {
  description = "Standard bucket name"
  value       = module.storage.standard_bucket_name
}

output "archive_bucket_name" {
  description = "Archive bucket name"
  value       = module.storage.archive_bucket_name
}

output "namespace" {
  description = "Object Storage namespace"
  value       = var.namespace
}

output "vault_id" {
  description = "Vault OCID (if enabled)"
  value       = var.enable_vault ? module.vault[0].vault_id : null
}

output "vault_management_endpoint" {
  description = "Vault management endpoint (if enabled)"
  value       = var.enable_vault ? module.vault[0].vault_management_endpoint : null
}
