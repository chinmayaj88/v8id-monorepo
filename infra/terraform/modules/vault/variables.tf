variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "database_host" {
  description = "Database host (for secret example)"
  type        = string
  default     = ""
}

variable "database_port" {
  description = "Database port"
  type        = number
  default     = 3306
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
