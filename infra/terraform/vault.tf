module "vault" {
  count  = var.enable_vault ? 1 : 0
  source = "./modules/vault"

  compartment_id = data.oci_identity_compartment.v8id_cloud.id
  project_name   = var.project_name
  tags           = var.tags
}
