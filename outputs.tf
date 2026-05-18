output "vm_inventory" {
  value = {
    for instance in vsphere_virtual_machine.WPC :
    instance.name => instance.default_ip_address
  }
  description = "Mapeo de nombres de hosts de las VMs desplegadas y sus respectivas IPs asignadas"
}