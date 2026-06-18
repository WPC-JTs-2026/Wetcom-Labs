# Archivo para desplegar la VCSA usando el instalador CLI desde la ISO

resource "local_file" "vcsa_json" {
  filename = "${path.module}/vcsa.json"
  content = jsonencode({
    "__version": "2.13.0",
    "ceip": {
      "settings": {
        "ceip_enabled": false
      }
    },
    "new_vcsa": {
      "esxi": {
        "hostname": "${var.esxi_deploy_host}",
        "username": "root",
        "password": "${var.esxi_password}",
        "deployment_network": "VM Network",
        "datastore": "datastore1"
      },
      "appliance": {
        "thin_disk_mode": true,
        "deployment_option": "tiny",
        "name": "vcsa-nested"
      },
      "network": {
        "ip_family": "ipv4",
        "mode": "static",
        "ip": var.vcsa_ip,
        "dns_servers": [var.vcsa_dns],
        "prefix": "24",
        "gateway": var.vcsa_gateway,
        "system_name": var.vcsa_fqdn
      },
      "os": {
        "password": var.vcsa_password,
        "ntp_servers": "1.pool.ntp.org",
        "ssh_enable": true
      },
      "sso": {
        "password": var.vcsa_password,
        "domain_name": "vsphere.local"
      }
    }
  })
}

resource "null_resource" "deploy_vcsa" {
  depends_on = [
    local_file.vcsa_json,
  ]

  # Trigger cada vez que cambie el archivo json o si no existe
  triggers = {
    json_hash = md5(local_file.vcsa_json.content)
  }

  provisioner "local-exec" {
    command = "node ${path.module}/deploy_vcsa.js ${path.module}/vcsa.json ${path.module}/vcsa_iso_extract ${var.esxi_deploy_host}"
  }
}

