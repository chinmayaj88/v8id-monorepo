module "storage" {
  source = "./modules/storage"

  compartment_id = data.oci_identity_compartment.v8id_cloud.id
  namespace      = var.oci_namespace
  project_name   = var.project_name
  tags           = var.tags
}
