# # # VARIABLES VSPHERE (PLAYGOURND) # # #

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

# # # VARIABLES ESXI NESTED # # #

variable "esxi_ovf_local_path" {
  type        = string
  description = "Ruta local al archivo OVA/OVF de la template ESXi Nested (relativa al directorio de trabajo)"
}

variable "esxi_name_prefix" {
  type        = string
  description = "Prefijo de nombre para cada VM. Si no se define, Terraform pedirá el valor por consola."
}

variable "esxi_deploy_host" {
  type        = string
  description = "FQDN o IP del host físico ESXi del cluster donde se desplegará la OVA (requerido para ovf_deploy)"
}

variable "esxi_hosts_info" {
  type = list(object({
    user     = string
    password = string
    address  = string
  }))
  description = "Lista de hosts ESXi con IP y credenciales. Se requiere para desplegar stage1."

  validation {
    condition     = length(var.esxi_hosts_info) > 0
    error_message = "esxi_hosts_info debe contener al menos un host ESXi para stage1."
  }
}

variable "esxi_cpu_count" {
  type        = number
  default     = 4
  description = "Cantidad de vCPUs para cada VM ESXi Nested (mínimo recomendado: 4)"
}

variable "esxi_memory_mb" {
  type        = number
  default     = 24576
  description = "Memoria RAM en MB para cada VM ESXi Nested (mínimo recomendado: 8192)"
}

variable "esxi_disk_size_gb" {
  type        = number
  default     = 200
  description = "Tamaño del disco donde se instalará vCenter (en un único host)"
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

# # # VARIABLES TRUENAS # # #

variable "deploy_truenas" {
  type        = bool
  default     = true
  description = "Habilitar despliegue de VM de TrueNAS"
}

variable "truenas_template_name" {
  type        = string
  description = "Nombre de la template de TrueNAS en el inventario de vSphere"
}

variable "truenas_vm_prefix" {
  type        = string
  description = "Nombre base para la VM de TrueNAS. Se le agregará el dominio definido en vm_domain."
}

variable "truenas_vm_cpus" {
  type        = number
  default     = 2
  description = "Cantidad de vCPUs para la VM de TrueNAS. Si se deja en 0, se usará el valor definido en la template."
}

variable "truenas_vm_memory" {
  type        = number
  default     = 8192
  description = "Memoria RAM en MB para la VM de TrueNAS. Si se deja en 0, se usará el valor definido en la template."
}

variable "truenas_vm_ip" {
  type        = string
  description = "Dirección IP estática para la VM de TrueNAS"
}

variable "truenas_vm_netmask" {
  type        = number
  default     = 24
  description = "Máscara de red para la VM de TrueNAS"
}

variable "truenas_vm_gateway" {
  type        = string
  default     = "10.106.3.1"
  description = "Gateway para la VM de TrueNAS"
}

variable "truenas_ssh_password" {
  type        = string
  sensitive   = true
  description = "Contraseña de root/SSH para la VM de TrueNAS"
}

variable "truenas_template_initial_ip" {
  type        = string
  default     = "10.106.3.210"
  description = "IP inicial de la plantilla de TrueNAS para la primera conexión SSH"
}