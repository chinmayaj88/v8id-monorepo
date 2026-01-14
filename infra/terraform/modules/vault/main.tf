# Vault
resource "oci_vault_vault" "v8id_vault" {
  compartment_id = var.compartment_id
  display_name   = "${var.project_name}-vault"
  vault_type     = "DEFAULT"

  freeform_tags = var.tags
}

# Master Encryption Key
resource "oci_kms_key" "v8id_master_key" {
  compartment_id      = var.compartment_id
  display_name        = "${var.project_name}-master-key"
  management_endpoint = oci_vault_vault.v8id_vault.management_endpoint
  key_shape {
    algorithm = "AES"
    length    = 32
  }

  freeform_tags = var.tags
}

# Secret for database credentials (example)
resource "oci_vault_secret" "database_credentials" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-database-credentials"
  vault_id       = oci_vault_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content = base64encode(jsonencode({
      host     = var.database_host
      port     = var.database_port
      database = var.database_name
      # Note: Actual credentials should be set manually via OCI Console or CLI
    }))
  }

  freeform_tags = var.tags
}
