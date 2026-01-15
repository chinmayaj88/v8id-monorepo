# Vault
resource "oci_kms_vault" "v8id_vault" {
  compartment_id = var.compartment_id
  display_name   = "${var.project_name}-vault"
  vault_type     = "DEFAULT"

  freeform_tags = var.tags
}

# Master Encryption Key
resource "oci_kms_key" "v8id_master_key" {
  compartment_id      = var.compartment_id
  display_name        = "${var.project_name}-master-key"
  management_endpoint = oci_kms_vault.v8id_vault.management_endpoint
  key_shape {
    algorithm = "AES"
    length    = 32
  }

  freeform_tags = var.tags
}

# Secrets - These should be populated manually via OCI Console or CLI
# The content here is just a placeholder structure

# Database URL
resource "oci_vault_secret" "database_url" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-DATABASE_URL"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    # Base64 encoded placeholder - UPDATE THIS via OCI Console
    content = base64encode("mysql://user:password@host:3306/database")
  }

  description   = "Database connection URL"
  freeform_tags = var.tags
}

# JWT Secret
resource "oci_vault_secret" "jwt_secret" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-JWT_SECRET"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    # Base64 encoded placeholder - UPDATE THIS via OCI Console
    content = base64encode("REPLACE_WITH_SECURE_32_CHAR_SECRET")
  }

  description   = "JWT signing secret"
  freeform_tags = var.tags
}

# TOTP Encryption Key
resource "oci_vault_secret" "totp_encryption_key" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-TOTP_ENCRYPTION_KEY"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    # Base64 encoded placeholder - UPDATE THIS via OCI Console
    content = base64encode("REPLACE_WITH_SECURE_32_CHAR_ENCRYPTION_KEY")
  }

  description   = "TOTP encryption key"
  freeform_tags = var.tags
}

# SMTP Configuration
resource "oci_vault_secret" "smtp_user" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-SMTP_USER"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content      = base64encode("your-email@gmail.com")
  }

  description   = "SMTP username"
  freeform_tags = var.tags
}

resource "oci_vault_secret" "smtp_password" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-SMTP_PASSWORD"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    # Base64 encoded placeholder - UPDATE THIS via OCI Console
    content = base64encode("REPLACE_WITH_APP_PASSWORD")
  }

  description   = "SMTP password (app-specific password)"
  freeform_tags = var.tags
}

# OCI Object Storage Namespace
resource "oci_vault_secret" "oci_namespace" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-OCI_OBJECT_STORAGE_NAMESPACE"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content      = base64encode(var.oci_namespace)
  }

  description   = "OCI Object Storage namespace"
  freeform_tags = var.tags
}

# OCI Region
resource "oci_vault_secret" "oci_region" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-OCI_REGION"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content      = base64encode(var.oci_region)
  }

  description   = "OCI region"
  freeform_tags = var.tags
}

# Frontend URL
resource "oci_vault_secret" "frontend_url" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-FRONTEND_URL"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content      = base64encode(var.frontend_url)
  }

  description   = "Frontend application URL for CORS"
  freeform_tags = var.tags
}

# Admin Email
resource "oci_vault_secret" "admin_email" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-ADMIN_EMAIL"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    content      = base64encode(var.admin_email)
  }

  description   = "Admin user email"
  freeform_tags = var.tags
}

# Admin Password (should be rotated after first login)
resource "oci_vault_secret" "admin_password" {
  compartment_id = var.compartment_id
  secret_name    = "${var.project_name}-ADMIN_PASSWORD"
  vault_id       = oci_kms_vault.v8id_vault.id
  key_id         = oci_kms_key.v8id_master_key.id

  secret_content {
    content_type = "BASE64"
    # Base64 encoded placeholder - UPDATE THIS via OCI Console
    content = base64encode("REPLACE_WITH_SECURE_PASSWORD")
  }

  description   = "Admin user initial password"
  freeform_tags = var.tags
}
