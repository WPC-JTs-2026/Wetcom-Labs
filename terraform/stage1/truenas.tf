resource "vsphere_virtual_machine" "truenas_vm" {
  count = var.deploy_truneas ? 1 : 0

  name             = "${var.truenas_vm_prefix}${var.vm_domain}"
  resource_pool_id = data.vsphere_resource_pool.pool.id
  folder           = var.vm_folder_path
  datastore_id     = data.vsphere_datastore.datastore.id

  num_cpus = var.truenas_vm_cpus
  memory   = var.truenas_vm_memory
  
  # Parche de seguridad para el plan interactivo
  guest_id = data.vsphere_virtual_machine.truenas_template.guest_id != "" ? data.vsphere_virtual_machine.truenas_template.guest_id : "ubuntu64Guest"

  network_interface {
    network_id   = data.vsphere_network.network.id
    adapter_type = data.vsphere_virtual_machine.truenas_template.network_interface_types[0]
  }

  dynamic "disk" {
    for_each = data.vsphere_virtual_machine.truenas_template.disks
    content {
      label            = "disk${disk.key}"
      size             = disk.value.size
      thin_provisioned = disk.value.thin_provisioned
      unit_number      = disk.key
    }
  }

  clone {
    template_uuid = data.vsphere_virtual_machine.truenas_template.id
    customize {
      linux_options {
        host_name = var.truenas_vm_prefix
        domain    = trimprefix(var.vm_domain, ".")
      }
      network_interface {
        ipv4_address = var.truenas_vm_ip
        ipv4_netmask = var.truenas_vm_netmask
      }
      ipv4_gateway = var.truenas_vm_gateway
    }
  }
}