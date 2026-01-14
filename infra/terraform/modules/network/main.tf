# VCN
resource "oci_core_vcn" "v8id_vcn" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.project_name}-vcn"
  dns_label      = "v8idvcn"  # DNS label: lowercase, 1-15 chars, start with letter, no hyphens

  freeform_tags = var.tags
}

# Internet Gateway
resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-igw"
  enabled        = true

  freeform_tags = var.tags
}

# NAT Gateway (optional - not available on free tier)
# For 7-user setup, we can use Internet Gateway directly if NAT is not available
resource "oci_core_nat_gateway" "nat" {
  count = 0  # Disabled: Not available on free tier. Using Internet Gateway instead.

  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-nat"

  freeform_tags = var.tags
}

# Service Gateway (optional - not available on free tier)
# Disabled: Not available on free tier accounts
# resource "oci_core_service_gateway" "sgw" {
#   compartment_id = var.compartment_id
#   vcn_id         = oci_core_vcn.v8id_vcn.id
#   display_name   = "${var.project_name}-sgw"
#
#   services {
#     service_id = data.oci_core_services.all_services.services[0].id
#   }
#
#   freeform_tags = var.tags
# }
#
# data "oci_core_services" "all_services" {
#   filter {
#     name   = "name"
#     values = ["All .* Services In Oracle Services Network"]
#     regex  = true
#   }
# }

# Public Subnet
resource "oci_core_subnet" "public" {
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.v8id_vcn.id
  cidr_block        = var.public_subnet_cidr
  display_name      = "${var.project_name}-public-subnet"
  dns_label         = "v8idpublic"  # DNS label: lowercase, 1-15 chars, start with letter
  security_list_ids = [oci_core_security_list.public.id]
  route_table_id    = oci_core_route_table.public.id

  freeform_tags = var.tags
}

# Private Subnet
resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.v8id_vcn.id
  cidr_block                 = var.private_subnet_cidr
  display_name               = "${var.project_name}-private-subnet"
  dns_label                  = "v8idprivate"  # DNS label: lowercase, 1-15 chars, start with letter
  security_list_ids          = [oci_core_security_list.private.id]
  route_table_id             = oci_core_route_table.private.id
  prohibit_public_ip_on_vnic = true

  freeform_tags = var.tags
}

# Public Route Table
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.igw.id
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
  }

  freeform_tags = var.tags
}

# Private Route Table
# For free tier (no NAT/Service Gateway): Use Internet Gateway for outbound traffic
resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-private-rt"

  # Use Internet Gateway for outbound (NAT not available on free tier)
  # For 7-user setup, this is acceptable
  route_rules {
    network_entity_id = oci_core_internet_gateway.igw.id
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
  }

  freeform_tags = var.tags
}

# Public Security List
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-public-sl"

  # Allow inbound HTTP
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Allow inbound HTTPS
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow inbound SSH (restrict in production)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Allow all outbound
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }

  freeform_tags = var.tags
}

# Private Security List
resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.v8id_vcn.id
  display_name   = "${var.project_name}-private-sl"

  # Allow inbound from VCN
  ingress_security_rules {
    protocol    = "all"
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"
  }

  # Allow all outbound
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }

  freeform_tags = var.tags
}
