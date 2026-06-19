data "vsphere_datacenter" "dc" {
  name = var.datacenter_name
}

data "vsphere_compute_cluster" "cluster" {
  name          = var.cluster_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_datastore" "datastore" {
  name          = var.datastore_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "network" {
  name          = var.network_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

# Eliminamos el data source vsphere_virtual_machine.template ya que ahora
# desplegamos desde OVA local con ovf_deploy en lugar de clonar una template.

data "vsphere_resource_pool" "pool" {
  name          = var.resource_pool_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

# Host físico requerido para ovf_deploy.
# Se resuelve automáticamente el primer host del cluster si no se especifica.

data "vsphere_host" "host" {
  name          = var.esxi_deploy_host
  datacenter_id = data.vsphere_datacenter.dc.id
}
