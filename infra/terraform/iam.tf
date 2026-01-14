module "iam" {
  source = "./modules/iam"

  compartment_id       = data.oci_identity_compartment.v8id_cloud.id
  tenancy_ocid         = var.tenancy_ocid
  project_name         = var.project_name
  standard_bucket_name = module.storage.standard_bucket_name
  archive_bucket_name  = module.storage.archive_bucket_name
  enable_vault         = var.enable_vault
  tags                 = var.tags
}
