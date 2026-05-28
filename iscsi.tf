# Automatización total de la conectividad iSCSI por SSH
resource "null_resource" "configure_iscsi_esxi" {
  triggers = {
    esxi_host          = var.esxi_host_name
    iscsi_ip           = var.esxi_iscsi_ip
    esxi_iscsi_netmask = var.esxi_iscsi_netmask
    vmkernel_interface = var.vmkernel_interface
    truenas_ip         = var.truenas_ip
    chap_user          = var.truenas_chap_user
    vswitch            = var.vswitch_name
    portgroup          = var.network_portgroup
  }

  connection {
    type     = "ssh"
    user     = "root"
    password = var.esxi_root_password
    host     = var.esxi_host_name
  }

  # Subimos el secreto a un archivo temporal para evitar exponerlo en los logs de remote-exec
  provisioner "file" {
    content     = var.truenas_chap_pass
    destination = "/tmp/.chap_secret"
  }

  provisioner "remote-exec" {
    inline = [
      # Asegura la eliminación del archivo temporal independientemente del resultado del script
      "trap 'rm -f /tmp/.chap_secret' EXIT",

      # 1. Crear el vSwitch Estándar para Storage
      "esxcli network vswitch standard add --vswitch-name='${var.vswitch_name}' || true",
      "esxcli network vswitch standard uplink add --uplink-name='${var.vswitch_uplink}' --vswitch-name='${var.vswitch_name}' || true",

      # 2. Crear el PortGroup dedicado a iSCSI
      "esxcli network vswitch standard portgroup add --portgroup-name='${var.network_portgroup}' --vswitch-name='${var.vswitch_name}' || true",

      # 3. Habilitar el adaptador iSCSI por software del ESXi
      "esxcli iscsi software set --enabled=true",

      # 4. Crear la interfaz VMkernel y asignarle la IP de la red de Storage
      "esxcli network ip interface add --interface-name='${var.vmkernel_interface}' --portgroup-name='${var.network_portgroup}' || true",
      "esxcli network ip interface ipv4 set --interface-name='${var.vmkernel_interface}' --ipv4='${var.esxi_iscsi_ip}' --netmask='${var.esxi_iscsi_netmask}' --type=static",

      # 5. Network Port Binding: Forzar a que iSCSI use esta nueva IP
      "esxcli iscsi networkportal add --nic '${var.vmkernel_interface}' --adapter=$(esxcli iscsi adapter list | grep 'Software iSCSI' | awk '{print $1}') || true",

      # 6. Configurar las credenciales CHAP para que TrueNAS te dé acceso sin mostrar la contraseña en logs
      "esxcli iscsi adapter auth chap set --direction=uni --authname='${var.truenas_chap_user}' --secret=$(cat /tmp/.chap_secret) --level=required --adapter=$(esxcli iscsi adapter list | grep 'Software iSCSI' | awk '{print $1}')",

      # 7. Apuntar al TrueNAS (Dynamic Discovery) y lanzar el escaneo de reclamación
      "esxcli iscsi adapter discovery sendtarget add --address='${var.truenas_ip}' --adapter=$(esxcli iscsi adapter list | grep 'Software iSCSI' | awk '{print $1}') || true",

      # Al escanear, el ESXi monta la LUN existente automáticamente sin reformatear
      "esxcli storage core adapter rescan --all"
    ]
  }
}