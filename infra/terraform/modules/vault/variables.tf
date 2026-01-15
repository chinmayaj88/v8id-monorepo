variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "oci_namespace" {
  description = "OCI Object Storage namespace"
  type        = string
}

variable "oci_region" {
  description = "OCI region"
  type        = string
}

variable "frontend_url" {
  description = "Frontend application URL"
  type        = string
  default     = "http://localhost:3000"
}

variable "admin_email" {
  description = "Admin user email"
  type        = string
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

