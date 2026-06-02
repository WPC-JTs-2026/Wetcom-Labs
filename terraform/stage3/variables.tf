variable "vsphere_server" {
  type        = string
  description = "FQDN o dirección IP del vCenter Server"
}

variable "vsphere_user" {
  type        = string
  description = "Usuario de vCenter"
}

variable "vsphere_password" {
  type        = string
  sensitive   = true
  description = "Credenciales de acceso al vCenter"
}

variable "datacenter_name" {
  type        = string
  description = "Nombre del objeto Datacenter en vSphere"
}

variable "cluster_name" {
  type        = string
  description = "Nombre del Compute Cluster en vSphere"
}

variable "hosts_info" {
  type        = list(map(string))
  default     = []
  description = "Lista de información de los hosts ESXi a agregar al vCenter. Debe contener los siguientes campos: user, password, address y, opcionalmente, thumbprint"
}