variable "esxi_deploy_host" {
  type        = string
  description = "FQDN o IP del host ESXi donde se desplegará el nuevo vCenter"
}

variable "esxi_password" {
  type        = string
  sensitive   = true
  description = "Contraseña de root para el host ESXi donde se desplegará el nuevo vCenter"
}

variable "vcsa_netmask" {
  type        = string
  default     = "255.255.255.0"
  description = "Máscara de subred para el nuevo vCenter"
}

variable "vcsa_gateway" {
  type        = string
  description = "Gateway para el nuevo vCenter"
}

variable "vcsa_dns" {
  type        = string
  description = "Servidor DNS para el nuevo vCenter"
}

variable "vcsa_ip" {
  type        = string
  description = "IP del nuevo vCenter"
}

variable "vcsa_fqdn" {
  type        = string
  description = "FQDN del nuevo vCenter"
}

variable "vcsa_password" {
  type        = string
  sensitive   = true
  description = "Password de root y administrator@vsphere.local del nuevo vCenter"
}

variable "vcsa_exctract_path" {
  type        = string
  description = "Ruta absoluta a la carpeta donde se extrajo la ISO de instalación de vCenter"
}
