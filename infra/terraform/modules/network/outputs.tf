output "vcn_id" {
  description = "VCN OCID"
  value       = oci_core_vcn.v8id_vcn.id
}

output "vcn_cidr" {
  description = "VCN CIDR block"
  value       = oci_core_vcn.v8id_vcn.cidr_blocks[0]
}

output "public_subnet_id" {
  description = "Public subnet OCID"
  value       = oci_core_subnet.public.id
}

output "private_subnet_id" {
  description = "Private subnet OCID"
  value       = oci_core_subnet.private.id
}

output "nat_gateway_id" {
  description = "NAT Gateway OCID (if available)"
  value       = length(oci_core_nat_gateway.nat) > 0 ? oci_core_nat_gateway.nat[0].id : null
}

output "internet_gateway_id" {
  description = "Internet Gateway OCID"
  value       = oci_core_internet_gateway.igw.id
}
