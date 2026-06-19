data "vsphere_virtual_machine" "truenas_template" {
  count         = var.deploy_truenas ? 1 : 0
  name          = var.truenas_template_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

resource "vsphere_virtual_machine" "truenas_vm" {
  count = var.deploy_truenas ? 1 : 0

  name             = "${var.truenas_vm_prefix}${var.vm_domain}"
  resource_pool_id = data.vsphere_resource_pool.pool.id
  folder           = var.vm_folder_path
  datastore_id     = data.vsphere_datastore.datastore.id

  num_cpus = var.truenas_vm_cpus
  memory   = var.truenas_vm_memory

  # Parche de seguridad para el plan interactivo
  guest_id = data.vsphere_virtual_machine.truenas_template[count.index].guest_id != "" ? data.vsphere_virtual_machine.truenas_template[count.index].guest_id : "ubuntu64Guest"

  wait_for_guest_net_timeout  = 0
  wait_for_guest_ip_timeout   = 0
  wait_for_guest_net_routable = false

  network_interface {
    network_id   = data.vsphere_network.network.id
    adapter_type = data.vsphere_virtual_machine.truenas_template[count.index].network_interface_types[0]
  }

  dynamic "disk" {
    for_each = data.vsphere_virtual_machine.truenas_template[count.index].disks
    content {
      label = "disk${disk.key}"
      # Use max() to ensure the cloned disk is never smaller than the template
      # source disk. The vSphere provider may return 0 for thin-provisioned
      # template disks, causing: "disk name disk0 must be at least the same
      # size of source when cloning (expected: >= 80 GiB)".
      size             = max(disk.value.size, 80)
      thin_provisioned = disk.value.thin_provisioned
      unit_number      = disk.key
    }
  }

  clone {
    template_uuid = data.vsphere_virtual_machine.truenas_template[count.index].id
    # customize {
    #   linux_options {
    #     host_name = var.truenas_vm_prefix
    #     domain    = trimprefix(var.vm_domain, ".")
    #   }
    #   network_interface {
    #     ipv4_address = var.truenas_vm_ip
    #     ipv4_netmask = var.truenas_vm_netmask
    #   }
    #   ipv4_gateway = var.truenas_vm_gateway
    # }
  }
  # ── Paso 1: Subir set_ip.sh a la IP original ────────────────────────────────
  provisioner "file" {
    connection {
      type     = "ssh"
      host     = "10.106.3.210"
      user     = "root"
      password = "Wetcom01!"
    }

    # SIN set -e: el script no debe abortar cuando SSH se corta por el commit
    content     = <<EOT
#!/bin/sh
midclt call interface.update vmx0 '{"aliases": [{"type": "INET", "address": "${var.truenas_vm_ip}", "netmask": ${var.truenas_vm_netmask}}]}'
midclt call interface.commit '{"rollback": true, "checkin_timeout": 120}'
exit 0
EOT
    destination = "/tmp/set_ip.sh"
  }

  # ── Paso 2: Ejecutar set_ip.sh (SSH se cortará cuando cambie la IP) ──────────
  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = "10.106.3.210"
      user     = "root"
      password = "Wetcom01!"
    }

    inline = [
      "sh /tmp/set_ip.sh; exit 0"
    ]
  }

  # ── Paso 3: Checkin desde la nueva IP (con reintentos via bash loop) ─────────
  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = var.truenas_vm_ip
      user     = "root"
      password = "Wetcom01!"
      timeout  = "3m" # tiempo máximo para establecer conexión
    }

    inline = [
      # Reintentar el checkin hasta que funcione (por si la interfaz aún está levantando)
      "for i in 1 2 3 4 5; do midclt call interface.checkin && break || sleep 10; done"
    ]
  }

  # ── Paso 4: Subir y ejecutar post_config.sh desde la nueva IP ───────────────
  provisioner "file" {
    connection {
      type     = "ssh"
      host     = var.truenas_vm_ip
      user     = "root"
      password = "Wetcom01!"
    }

    content     = <<EOT
#!/bin/sh
set -e
midclt call iscsi.portal.update 1 '{"listen": [{"ip": "${var.truenas_vm_ip}", "port": 3260}]}'
midclt call service.restart iscsitarget
EOT
    destination = "/tmp/post_config.sh"
  }

  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = var.truenas_vm_ip
      user     = "root"
      password = "Wetcom01!"
    }

    inline = [
      "sh /tmp/post_config.sh"
    ]
  }
}
