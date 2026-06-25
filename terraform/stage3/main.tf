resource "vsphere_datacenter" "dc" {
  name = var.datacenter_name
}

resource "vsphere_compute_cluster" "cluster" {
  name          = var.cluster_name
  datacenter_id = vsphere_datacenter.dc.moid
  
  drs_enabled   = false
  ha_enabled    = false
  vsan_enabled  = false
}

data "vsphere_host_thumbprint" "thumbprint" {
  count     = length(var.hosts_info)
  address   = var.hosts_info[count.index].address
  insecure  = true
}

resource "vsphere_host" "hosts" {
  count      = length(var.hosts_info)
  hostname   = var.hosts_info[count.index].address
  username   = var.hosts_info[count.index].user
  password   = var.hosts_info[count.index].password
  thumbprint = data.vsphere_host_thumbprint.thumbprint[count.index].id
  force      = true
  cluster    = vsphere_compute_cluster.cluster.id
}
