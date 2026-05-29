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
  default     = 3
  description = "Cantidad de instancias idénticas a desplegar"
}

variable "vm_name_prefix" {
  type        = string
  description = "Prefijo de nombre para cada VM. Si no se define, Terraform pedirá el valor por consola."
}

variable "vm_domain" {
  type        = string
  default     = ".pi.playground.net"
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

variable "esxi_host_name" {
  type        = string
  description = "Escribe el nombre exacto del host ESXi (ej. esxi-01.playground.net):"
}


# --- Datos de Conexión al Host ---
variable "esxi_root_password" {
  type        = string
  description = "Contraseña de root del ESXi (para SSH):"
  sensitive   = true
}

# --- Configuración de Red iSCSI ---
variable "network_portgroup" {
  type        = string
  description = "Nombre del PortGroup de iSCSI (ej: IP Storage 1):"
}

variable "esxi_iscsi_ip" {
  type        = string
  description = "IP estática que tendrá el ESXi en la red iSCSI:"
}

variable "esxi_iscsi_netmask" {
  type        = string
  default     = "255.255.255.0"
  description = "Máscara de subred para la VMkernel de iSCSI:"
}

variable "vmkernel_interface" {
  type        = string
  description = "Nombre de la interfaz VMkernel para iSCSI (ej: vmk1, vmk2):"
}

# --- Datos del TrueNAS ---
variable "truenas_ip" {
  type        = string
  description = "IP del servidor TrueNAS (Portal iSCSI):"
}

variable "truenas_chap_user" {
  type        = string
  description = "Usuario CHAP configurado en TrueNAS:"
}

variable "truenas_chap_pass" {
  type        = string
  description = "Secreto CHAP configurado en TrueNAS:"
  sensitive   = true
}

# --- Variables nuevas para el vSwitch ---
variable "vswitch_name" {
  type        = string
  description = "Nombre del nuevo vSwitch a crear (ej: vSwitch-iSCSI):"
}

variable "vswitch_uplink" {
  type        = string
  description = "Nombre del adaptador físico a usar en el ESXi (ej: vmnic1 o vmnic2):"
}