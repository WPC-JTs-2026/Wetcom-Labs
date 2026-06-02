# Copied from main.tf (ESXi host deployment)

locals {
  // Nombre de la red OVF definida en el descriptor de la OVA.
  // La Nested ESXi 8.0b Appliance utiliza "VM Network" como nombre de red.
  ovf_network_name = "VM Network"
}

resource "vsphere_virtual_machine" "WPC" {
  count = var.vm_count

  name = "${var.vm_name_prefix}${format("%02d", count.index + 1)}${var.vm_domain}"

  # Asignación del ID del Resource Pool validado
  resource_pool_id = data.vsphere_resource_pool.pool.id

  # Host físico del cluster requerido para el despliegue OVF
  host_system_id = data.vsphere_host.host.id

  # Asignación de la ruta de la carpeta de destino (usando la variable directamente).
  folder = var.vm_folder_path

  datastore_id  = data.vsphere_datastore.datastore.id
  datacenter_id = data.vsphere_datacenter.dc.id

  # Hardware - configurable via variables
  num_cpus          = var.esxi_cpu_count
  memory            = var.esxi_memory_mb
  guest_id          = "vmkernel65Guest"
  nested_hv_enabled = true
  firmware          = "efi"

  # No esperar a que VMware Tools reporte la IP (ESXi no lo reporta igual que Linux/Windows)
  wait_for_guest_net_timeout = 0

  # Interfaz de red - mapeada al port group de vSphere
  network_interface {
    network_id = data.vsphere_network.network.id
  }

  # Despliegue desde OVA local
  ovf_deploy {
    local_ovf_path    = var.ovf_local_path
    disk_provisioning = "thin"

    ovf_network_map = {
      (local.ovf_network_name) = data.vsphere_network.network.id
    }
  }

  # Disco único configurado mediante variables
  disk {
    label            = "disk1"
    size             = var.esxi_disk_size_gb > 0 ? var.esxi_disk_size_gb : 20
    thin_provisioned = true
    unit_number      = 1
    controller_type  = "nvme"
  }

  # Propiedades OVF (vApp) para configuración inicial del host ESXi
  # La Nested ESXi OVA de William Lam soporta configuración via guestinfo.*
  vapp {
    properties = {
      "guestinfo.hostname"   = "${var.vm_name_prefix}${format("%02d", count.index + 1)}"
      "guestinfo.ipaddress"  = "${var.esxi_ip_subnet}.${var.esxi_ip_start_offset + count.index}"
      "guestinfo.netmask"    = var.esxi_netmask
      "guestinfo.gateway"    = var.esxi_gateway
      "guestinfo.dns"        = var.esxi_dns
      "guestinfo.domain"     = var.vm_domain
      "guestinfo.ntp"        = "1.pool.ntp.org"
      "guestinfo.password"   = var.esxi_password
      "guestinfo.ssh"        = var.esxi_ssh_enabled ? "True" : "False"
      "guestinfo.createvmfs" = count.index == 0 ? "True" : (var.esxi_create_vmfs ? "True" : "False")
    }
  }

  lifecycle {
    ignore_changes = [
      # Ignorar cambios en propiedades OVF después del deploy inicial,
      # ya que ESXi puede modificar valores internos post-boot.
      vapp,
      # Ignorar cambios en ovf_deploy ya que solo se usa en la creación.
      ovf_deploy,
    ]
  }
}
