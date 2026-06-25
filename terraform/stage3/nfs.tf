
resource "vsphere_nas_datastore" "nfs_datastore" {
  count = var.nfs_enabled ? 1 : 0

  name            = var.nfs_datastore_name
  host_system_ids = [for host in vsphere_host.hosts : host.id]
  type            = "NFS"

  remote_hosts = [var.truenas_ip]
  remote_path  = var.nfs_remote_path
  access_mode  = var.nfs_access_mode
}