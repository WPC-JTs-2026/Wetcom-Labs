output "vm_inventory" {
  value = {
    for idx, instance in vsphere_virtual_machine.WPC :
    instance.name => "${var.esxi_ip_subnet}.${var.esxi_ip_start_offset + idx}"
  }
  description = "Mapeo de nombres de los hosts ESXi desplegados y sus respectivas IPs asignadas"
}