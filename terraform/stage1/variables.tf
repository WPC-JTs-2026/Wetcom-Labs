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

variable "ovf_local_path" {
  type        = string
  description = "Ruta local al archivo OVA/OVF de la template ESXi Nested (relativa al directorio de trabajo)"
}

variable "vm_count" {
  type        = number
  default     = 2
  description = "Cantidad de instancias ESXi idénticas a desplegar"
}

variable "vm_name_prefix" {
  type        = string
  description = "Prefijo de nombre para cada VM. Si no se define, Terraform pedirá el valor por consola."
}

variable "vm_domain" {
  type        = string
  description = "Dominio usado para el nombre completo de las VMs y configuración DNS de ESXi."
}

variable "vm_folder_path" {
  type        = string
  description = "Ruta del folder de VM bajo el datacenter vm root. No duplique /Playground/vm. Ejemplo: WPC/Ian Lucero."
}

variable "resource_pool_name" {
  type        = string
  description = "Nombre o ruta del Resource Pool asignado (ej: 'RP-Production' o 'Cluster01/Resources/RP-Tier1')"
}

variable "esxi_deploy_host" {
  type        = string
  description = "FQDN o IP del host físico ESXi del cluster donde se desplegará la OVA (requerido para ovf_deploy)"
}

variable "esxi_cpu_count" {
  type        = number
  default     = 4
  description = "Cantidad de vCPUs para cada VM ESXi Nested (mínimo recomendado: 4)"
}

variable "esxi_memory_mb" {
  type        = number
  default     = 8192
  description = "Memoria RAM en MB para cada VM ESXi Nested (mínimo recomendado: 8192)"
}

variable "esxi_disk_size_gb" {
  type        = number
  default     = 40
  description = "Tamaño del disco principal (único) en GB para cada ESXi (mínimo recomendado: 40 GB)"
}

variable "esxi_ip_subnet" {
  type        = string
  default     = "10.106.3"
  description = "Primeros 3 octetos de la subred para las VMs ESXi (ej: '10.106.3')"
}

variable "esxi_ip_start_offset" {
  type        = number
  default     = 150
  description = "Último octeto de la IP de la primera VM ESXi. Las siguientes se asignan secuencialmente (+1, +2, etc.)"
}

variable "esxi_netmask" {
  type        = string
  default     = "255.255.255.0"
  description = "Máscara de subred para vmk0 de cada ESXi"
}

variable "esxi_gateway" {
  type        = string
  default     = "10.106.3.1"
  description = "Gateway para vmk0 de cada ESXi"
}

variable "esxi_dns" {
  type        = string
  default     = "10.106.3.1"
  description = "Servidor DNS para cada ESXi"
}

variable "esxi_password" {
  type        = string
  sensitive   = true
  default     = "VMware1!"
  description = "Contraseña de root para los hosts ESXi Nested (por defecto VMware1!)"
}

variable "esxi_ssh_enabled" {
  type        = bool
  default     = true
  description = "Habilitar SSH en los hosts ESXi Nested"
}

variable "esxi_create_vmfs" {
  type        = bool
  default     = false
  description = "Crear automáticamente un datastore VMFS local (datastore1) en cada ESXi"
}
