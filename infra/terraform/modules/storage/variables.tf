variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "namespace" {
  description = "Object Storage namespace"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
