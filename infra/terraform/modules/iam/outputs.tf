output "dynamic_group_id" {
  description = "Dynamic group OCID"
  value       = oci_identity_dynamic_group.compute_instances.id
}

output "dynamic_group_name" {
  description = "Dynamic group name"
  value       = oci_identity_dynamic_group.compute_instances.name
}
