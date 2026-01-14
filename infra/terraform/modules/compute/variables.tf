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

variable "subnet_id" {
  description = "Subnet OCID for compute instance"
  type        = string
}

variable "assign_public_ip" {
  description = "Assign public IP to compute instance"
  type        = bool
  default     = false
}

variable "compute_shape" {
  description = "Compute instance shape (Try VM.Standard.A1.Flex first, fallback to VM.Standard.E2.1.Micro if not available)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "compute_ocpus" {
  description = "Number of OCPUs (Always Free: 1 for E2.1.Micro - fixed, not configurable)"
  type        = number
  default     = 1
}

variable "compute_memory_gb" {
  description = "Memory in GB. For A1.Flex: minimum 6GB per OCPU. For E2.1.Micro: fixed at 1GB (not configurable)"
  type        = number
  default     = 6  # Minimum for A1.Flex (6GB per OCPU). Use 1GB if using E2.1.Micro
}

variable "compute_image_id" {
  description = "Compute image OCID (optional, uses latest Oracle Linux if not specified)"
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "SSH public key"
  type        = string
}

variable "storage_size_gb" {
  description = "Block volume size in GB (0 to skip block volume - use Object Storage instead)"
  type        = number
  default     = 0
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
