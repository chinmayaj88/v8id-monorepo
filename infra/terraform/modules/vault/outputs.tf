output "vault_id" {
  description = "Vault OCID"
  value       = oci_kms_vault.v8id_vault.id
}

output "vault_management_endpoint" {
  description = "Vault management endpoint"
  value       = oci_kms_vault.v8id_vault.management_endpoint
}

output "master_key_id" {
  description = "Master encryption key OCID"
  value       = oci_kms_key.v8id_master_key.id
}
