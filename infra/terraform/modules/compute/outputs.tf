output "instance_id" {
  description = "Compute instance OCID"
  value       = oci_core_instance.backend.id
}

output "instance_private_ip" {
  description = "Compute instance private IP"
  value       = oci_core_instance.backend.private_ip
}

output "instance_public_ip" {
  description = "Compute instance public IP (if assigned)"
  value       = oci_core_instance.backend.public_ip
}

output "instance_display_name" {
  description = "Compute instance display name"
  value       = oci_core_instance.backend.display_name
}
