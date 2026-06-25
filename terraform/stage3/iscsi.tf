locals {
  # Mapa de hosts indexados por su dirección IP para evitar crashes de indexación
  hosts_map = { for host in var.hosts_info : host.address => host }
}

# Automatización de la conectividad iSCSI por SSH en cada host ESXi
resource "null_resource" "configure_iscsi_esxi" {
  count = var.iscsi_enabled ? length(var.iscsi_network_config) : 0

  triggers = {
    host_address       = var.iscsi_network_config[count.index].host_address
    iscsi_ip           = var.iscsi_network_config[count.index].iscsi_ip
    iscsi_netmask      = var.iscsi_network_config[count.index].iscsi_netmask
    vmkernel_interface = var.vmkernel_interface
    truenas_ip         = var.truenas_ip
    chap_user          = var.truenas_chap_user
    vswitch            = var.vswitch_name
    portgroup          = var.network_portgroup
  }

  # Buscar las credenciales del host correspondiente en hosts_map de forma segura
  connection {
    type     = "ssh"
    user     = lookup(local.hosts_map, var.iscsi_network_config[count.index].host_address, { user = "", password = "" }).user
    password = lookup(local.hosts_map, var.iscsi_network_config[count.index].host_address, { user = "", password = "" }).password
    host     = var.iscsi_network_config[count.index].host_address
  }

  provisioner "remote-exec" {
    inline = [
      # 1. Crear el vSwitch Estándar para Storage
      "esxcli network vswitch standard add --vswitch-name='${var.vswitch_name}' || true",
      "esxcli network vswitch standard uplink add --uplink-name='${var.vswitch_uplink}' --vswitch-name='${var.vswitch_name}' || true",

      # 2. Crear el PortGroup dedicado a iSCSI
      "esxcli network vswitch standard portgroup add --portgroup-name='${var.network_portgroup}' --vswitch-name='${var.vswitch_name}' || true",

      # 3. Habilitar el adaptador iSCSI por software del ESXi
      "esxcli iscsi software set --enabled=true",

      # 4. Crear la interfaz VMkernel y asignarle la IP de la red de Storage
      "esxcli network ip interface add --interface-name='${var.vmkernel_interface}' --portgroup-name='${var.network_portgroup}' || true",
      "esxcli network ip interface ipv4 set --interface-name='${var.vmkernel_interface}' --ipv4='${var.iscsi_network_config[count.index].iscsi_ip}' --netmask='${var.iscsi_network_config[count.index].iscsi_netmask}' --type=static",

      # 5. Network Port Binding: Forzar a que iSCSI use esta nueva IP
      "esxcli iscsi networkportal add --nic '${var.vmkernel_interface}' --adapter=$(esxcli iscsi adapter list | grep 'iscsi_vmk' | awk '{print $1}') || true",

      # 6. Configurar las credenciales CHAP para TrueNAS
      "esxcli iscsi adapter auth chap set --direction=uni --authname='${var.truenas_chap_user}' --secret='${var.truenas_chap_pass}' --level=required --adapter=$(esxcli iscsi adapter list | grep 'iscsi_vmk' | awk '{print $1}')",

      # 7. Apuntar al TrueNAS (Dynamic Discovery)
      "esxcli iscsi adapter discovery sendtarget add --address='${var.truenas_ip}' --adapter=$(esxcli iscsi adapter list | grep 'iscsi_vmk' | awk '{print $1}') || true",

      # 8. Escanear para montar la LUN existente
      "esxcli storage core adapter rescan --all"
    ]
  }

  # Depende de que los hosts estén creados en vSphere
  depends_on = [vsphere_host.hosts]
}

data "vsphere_vmfs_disks" "available" {
  host_system_id = vsphere_host.hosts[0].id
  rescan         = true
  filter         = var.iscsi_disk_canonical_name
}

# Crear el datastore VMFS en el PRIMER host únicamente
resource "vsphere_vmfs_datastore" "iscsi_datastore" {
  count = var.iscsi_enabled ? 1 : 0

  name           = var.iscsi_datastore_name
  host_system_id = vsphere_host.hosts[1].id
  disks          = data.vsphere_vmfs_disks.available.disks

  depends_on = [null_resource.configure_iscsi_esxi]
}
