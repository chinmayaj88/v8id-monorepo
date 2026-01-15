variable "tenancy_ocid" {
  description = "OCID of the tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of the user"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint of the API key"
  type        = string
}

variable "private_key_path" {
  description = "Path to the private key file"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "OCI region (e.g., us-ashburn-1)"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_id" {
  description = "OCID of the v8id-cloud compartment"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "v8id-cloud"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vcn_cidr" {
  description = "CIDR block for VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "compute_shape" {
  description = "Compute instance shape (Try VM.Standard.A1.Flex first, fallback to VM.Standard.E2.1.Micro if not available)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "compute_ocpus" {
  description = "Number of OCPUs for compute instance (Always Free: 1 for E2.1.Micro - fixed, not configurable)"
  type        = number
  default     = 1
}

variable "compute_memory_gb" {
  description = "Memory in GB for compute instance. For A1.Flex: minimum 6GB per OCPU. For E2.1.Micro: fixed at 1GB (not configurable)"
  type        = number
  default     = 6  # Minimum for A1.Flex (6GB per OCPU). Use 1GB if using E2.1.Micro
}

variable "compute_image_id" {
  description = "OCID of the compute image (Oracle Linux)"
  type        = string
  default     = "" # Will use latest Oracle Linux if not specified
}

variable "ssh_public_key" {
  description = "SSH public key for compute instance"
  type        = string
}

variable "oci_namespace" {
  description = "Object Storage namespace"
  type        = string
}

variable "frontend_url" {
  description = "Frontend application URL"
  type        = string
  default     = "http://localhost:3000"
}

variable "admin_email" {
  description = "Initial admin user email"
  type        = string
}

variable "enable_vault" {
  description = "Enable OCI Vault for secrets management"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "v8id-cloud"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
