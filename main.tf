locals {
  vm_sufix = ".pi.playground.net"
}

resource "vsphere_virtual_machine" "WPC" {
  count = var.vm_count

  name             = "${format("tf%02d", count.index + 1)}${local.vm_sufix}"
  # Asignación del ID del Resource Pool validado
  resource_pool_id = data.vsphere_resource_pool.pool.id
  
  # Asignación de la ruta de la carpeta de destino
  # folder           = data.vsphere_folder.folder.path    

  datastore_id     = data.vsphere_datastore.datastore.id

  num_cpus = data.vsphere_virtual_machine.template.num_cpus
  memory   = data.vsphere_virtual_machine.template.memory
  guest_id = data.vsphere_virtual_machine.template.guest_id
  scsi_type = data.vsphere_virtual_machine.template.scsi_type

  network_interface {
    network_id   = data.vsphere_network.network.id
    adapter_type = data.vsphere_virtual_machine.template.network_interface_types[0]
  }

  disk {
    label            = "disk0"
    size             = data.vsphere_virtual_machine.template.disks[0].size
    thin_provisioned = data.vsphere_virtual_machine.template.disks[0].thin_provisioned
  }

  clone {
    template_uuid = data.vsphere_virtual_machine.template.id

    customize {
      linux_options {
        host_name = "${format("tf%02d", count.index + 1)}"
        domain    = "${local.vm_sufix}"
      }

      network_interface {
        ipv4_address = "10.106.3.${150 + count.index}"
        ipv4_netmask = 24
      }

      ipv4_gateway = "10.106.3.1"
    }
  }
}