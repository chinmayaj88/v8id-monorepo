module "network" {
  source = "./modules/network"

  compartment_id      = data.oci_identity_compartment.v8id_cloud.id
  project_name        = var.project_name
  vcn_cidr            = var.vcn_cidr
  public_subnet_cidr  = var.public_subnet_cidr
  private_subnet_cidr = var.private_subnet_cidr
  tags                = var.tags
}
