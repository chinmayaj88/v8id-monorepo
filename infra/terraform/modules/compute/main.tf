# Get latest Ubuntu 22.04 Minimal image compatible with the shape
# For E2.1.Micro (x86_64), we need to filter by shape to get compatible images
data "oci_core_images" "ubuntu_minimal" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.compute_shape  # Filter by shape to get compatible architecture
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
  
  # Filter for Minimal Ubuntu image
  filter {
    name   = "display_name"
    values = ["Canonical-Ubuntu-22.04-Minimal-*"]
    regex  = true
  }
}

# Fallback: Get any Ubuntu 22.04 image if Minimal not available
data "oci_core_images" "ubuntu_any" {
  count = length(data.oci_core_images.ubuntu_minimal.images) == 0 ? 1 : 0

  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.compute_shape  # Filter by shape to get compatible architecture
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  # Use Minimal if available, otherwise use any Ubuntu 22.04
  ubuntu_images = length(data.oci_core_images.ubuntu_minimal.images) > 0 ? data.oci_core_images.ubuntu_minimal.images : (length(data.oci_core_images.ubuntu_any) > 0 && length(data.oci_core_images.ubuntu_any[0].images) > 0 ? data.oci_core_images.ubuntu_any[0].images : [])
  ubuntu_image_id = length(local.ubuntu_images) > 0 ? local.ubuntu_images[0].id : ""
}

# Get availability domain
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Compute Instance
resource "oci_core_instance" "backend" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.project_name}-backend"
  shape               = var.compute_shape

  # shape_config is only supported for flexible shapes (A1.Flex, E4.Flex, etc.)
  # E2.1.Micro has fixed resources (1 OCPU, 1GB) and doesn't support shape_config
  dynamic "shape_config" {
    for_each = can(regex(".*\\.Flex$", var.compute_shape)) ? [1] : []
    content {
      ocpus         = var.compute_ocpus
      memory_in_gbs = var.compute_memory_gb
    }
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    assign_public_ip = var.assign_public_ip
    display_name     = "${var.project_name}-backend-vnic"
  }

  source_details {
    source_type = "image"
    source_id   = var.compute_image_id != "" ? var.compute_image_id : local.ubuntu_image_id
  }

  metadata = {
    ssh_authorized_keys = trimspace(var.ssh_public_key)
    user_data = base64encode(<<-EOF
#!/bin/bash
# Cloud-init script for v8id-cloud backend (Ubuntu)

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y ca-certificates curl gnupg lsb-release
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
systemctl enable docker
systemctl start docker

# Install Node.js 22 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Create application directory
mkdir -p /opt/${var.project_name}
chmod 755 /opt/${var.project_name}

# Log completion
echo "Cloud-init completed for ${var.project_name}" >> /var/log/cloud-init.log
EOF
    )
  }

  freeform_tags = var.tags

  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}

# Block Volume for persistent storage (optional - skip if storage_size_gb is 0)
resource "oci_core_volume" "backend_storage" {
  count = var.storage_size_gb > 0 ? 1 : 0

  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.project_name}-backend-storage"
  size_in_gbs         = var.storage_size_gb

  freeform_tags = var.tags
}

resource "oci_core_volume_attachment" "backend_storage_attach" {
  count = var.storage_size_gb > 0 ? 1 : 0

  attachment_type = "paravirtualized"
  compartment_id  = var.compartment_id
  instance_id     = oci_core_instance.backend.id
  volume_id       = oci_core_volume.backend_storage[0].id
  display_name    = "${var.project_name}-backend-storage-attach"
}
