module "compute" {
  source = "./modules/compute"

  compartment_id    = data.oci_identity_compartment.v8id_cloud.id
  tenancy_ocid      = var.tenancy_ocid
  project_name      = var.project_name
  subnet_id         = module.network.private_subnet_id
  assign_public_ip  = false # Use NAT gateway for outbound
  compute_shape     = var.compute_shape
  compute_ocpus     = var.compute_ocpus
  compute_memory_gb = var.compute_memory_gb
  compute_image_id  = var.compute_image_id
  ssh_public_key    = var.ssh_public_key
  storage_size_gb   = 0  # No block volume for Always Free (use Object Storage instead)
  tags              = var.tags
}
