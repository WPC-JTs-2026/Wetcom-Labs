# # # VARIABLES VSPHERE (NESTED) # # #

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
  default     = "Datacenter-001"
  description = "Nombre del objeto Datacenter en vSphere"
}

variable "cluster_name" {
  type        = string
  default     = "Cluster-001"
  description = "Nombre del Compute Cluster en vSphere"
}

# # # VARIABLES ESXI NESTED # # #

variable "hosts_info" {
  type        = list(map(string))
  default     = []
  description = "Lista de información de los hosts ESXi a agregar al vCenter. Debe contener los siguientes campos: user, password, address y, opcionalmente, thumbprint"
}

# # # VARIABLES TRUENAS # # #

variable "truenas_ip" {
  type        = string
  default     = ""
  description = "IP del servidor TrueNAS iSCSI"
}

variable "truenas_chap_user" {
  type        = string
  default     = ""
  description = "Usuario CHAP para autenticación en TrueNAS"
}

variable "truenas_chap_pass" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Contraseña CHAP para autenticación en TrueNAS"
}

# # # VARIABLES ISCSI # # #

variable "iscsi_enabled" {
  type        = bool
  default     = false
  description = "Habilitar configuración de iSCSI en los hosts"
}

variable "vswitch_name" {
  type        = string
  default     = "vSwitch-Storage"
  description = "Nombre del vSwitch estándar para iSCSI"
}

variable "vswitch_uplink" {
  type        = string
  default     = "vmnic1"
  description = "NIC físico para el vSwitch de iSCSI"
}

variable "network_portgroup" {
  type        = string
  default     = "PortGroup-iSCSI"
  description = "Nombre del portgroup para iSCSI"
}

variable "vmkernel_interface" {
  type        = string
  default     = "vmk1"
  description = "Interfaz VMkernel para iSCSI"
}

variable "iscsi_network_config" {
  type        = list(map(string))
  default     = []
  description = "Configuración de red iSCSI por host. Campos: host_address, iscsi_ip, iscsi_netmask"
}


# # # VARIABLES NFS # # #

variable "nfs_enabled" {
  type        = bool
  default     = false
  description = "Habilitar configuración de Datastore NFS en los hosts"
}

variable "nfs_datastore_name" {
  type        = string
  description = "Nombre con el que aparecerá el Datastore NFS en el vCenter destino"
}

variable "nfs_remote_path" {
  type        = string
  default     = "/mnt/pool-almacenamiento/truenas-compartido"
  description = "Ruta del export o share NFS configurado en el TrueNAS"
}

variable "nfs_access_mode" {
  type        = string
  default     = "readWrite"
  description = "Modo de acceso del datastore NFS: readWrite o readOnly"

  validation {
    condition     = contains(["readWrite", "readOnly"], var.nfs_access_mode)
    error_message = "El modo de acceso debe ser 'readWrite' o 'readOnly'."
  }
}