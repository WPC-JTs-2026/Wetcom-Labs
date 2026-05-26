variable "vsphere_server" {
  type        = string
  description = "FQDN o dirección IP del vCenter Server en VCF"
}

variable "vsphere_user" {
  type        = string
  description = "Usuario de cuenta de servicio para la automatización"
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
  description = "Nombre del Compute Cluster de VCF"
}

variable "datastore_name" {
  type        = string
  description = "Nombre del Datastore (vSAN o VMFS)"
}

variable "network_name" {
  type        = string
  description = "Nombre del port group o segmento NSX-T"
}

variable "template_name" {
  type        = string
  description = "Nombre de la plantilla de VM (OVF/OVA u oS base configurado con Cloud-Init/Sysprep)"
}

variable "vm_count" {
  type        = number
  default     = 1
  description = "Cantidad de instancias idénticas a desplegar"
}

variable "vm_name_prefix" {
  type        = string
  description = "Prefijo de nombre para cada VM. Si no se define, Terraform pedirá el valor por consola."
}

variable "vm_domain" {
  type        = string
  default     = ".wpc.playground.net"
  description = "Dominio usado para el nombre completo de las VMs."
}

variable "vm_folder_path" {
  type        = string
  description = "Ruta del folder de VM bajo el datacenter vm root. No duplique /Playground/vm. Ejemplo: WPC/Ian Lucero."
}

variable "resource_pool_name" {
  type        = string
  description = "Nombre o ruta del Resource Pool asignado (ej: 'RP-Production' o 'Cluster01/Resources/RP-Tier1')"
}
