variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "tenancy_ocid" {
  description = "Tenancy OCID"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

# Note: Dynamic group uses compartment-based matching, not instance ID

variable "standard_bucket_name" {
  description = "Standard bucket name"
  type        = string
}

variable "archive_bucket_name" {
  description = "Archive bucket name"
  type        = string
}

variable "enable_vault" {
  description = "Enable Vault access policies"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
