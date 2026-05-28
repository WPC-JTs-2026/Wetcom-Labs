# 1. Conexión SSH directa al ESXi para configurar el adaptador iSCSI
resource "null_resource" "configure_iscsi_esxi" {
  
  # Usamos SSH para conectarnos al host
  connection {
    type     = "ssh"
    user     = "root"
    password = var.esxi_root_password
    host     = var.esxi_host_name # Asume que el nombre que pongas es resoluble (o pon directamente su IP)
  }

  # Ejecutamos los comandos nativos de VMware
  provisioner "remote-exec" {
    inline = [
      # Habilita el adaptador iSCSI por software
      "esxcli iscsi software set --enabled=true",
      # Agrega la IP del TrueNAS a la detección dinámica (el || true evita que falle si ya existía)
      "esxcli iscsi networkportal add --targetip=${var.truenas_ip} --adapter=vmhba64 || true",
      # Fuerza un escaneo completo de los adaptadores
      "esxcli storage core adapter rescan --all"
    ]
  }
}

# 2. Busca el host ESXi exacto en el vCenter
data "vsphere_host" "esxi_host" {
  name          = var.esxi_host_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

# 3. Escanea el host buscando el disco iSCSI recién descubierto
data "vsphere_vmfs_disks" "iscsi_disks" {
  host_system_id = data.vsphere_host.esxi_host.id
  rescan         = true
  filter         = "naa.*"

  # ¡Clave! Esto obliga a Terraform a esperar a que termine el SSH (paso 1)
  depends_on = [
    null_resource.configure_iscsi_esxi
  ]
}

# 4. Crea el Datastore con el primer disco encontrado
resource "vsphere_vmfs_datastore" "iscsi_datastore" {
  name           = var.iscsi_datastore_name
  host_system_id = data.vsphere_host.esxi_host.id
  disks          = [data.vsphere_vmfs_disks.iscsi_disks.disks[0]]
}