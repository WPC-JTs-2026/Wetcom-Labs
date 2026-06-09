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
    command     = <<EOT
      set -euo pipefail
      jsonPath="${path.module}/vcsa.json"
      extractPoint="${var.vcsa_exctract_path}"
      installerPath="$extractPoint/vcsa-cli-installer/lin64/vcsa-deploy.bin"

      # Validaciones previas
      if [ ! stat extractPoint >/dev/null 2>&1 ]; then
        echo "La carpeta de extracción $extractPoint no existe"
        echo "Por favor, asegúrate de que la ruta sea correcta y que se haya extraido la ISO."
        exit 1
      fi
      if [ ! stat "$installerPath" >/dev/null 2>&1 ]; then
        echo "El instalador CLI no se encontró en $installerPath"
        echo "Por favor, asegúrate de que la ISO se haya extraido correctamente y que el instalador esté presente."
        exit 1
      fi

      # Agregar dependencias y permisos de ejecución al instalador y sus bibliotecas
      export LD_LIBRARY_PATH="$extractPoint/vcsa-cli-installer/lin64:$extractPoint/vcsa-cli-installer/lin64/lib:$extractPoint/vcsa-cli-installer/lin64/lib/deps"
      chmod +x "$LD_LIBRARY_PATH/"*.so || true
      find /home/wpc/vcsa_iso_extract -name "*.bin" -o -name "ovftool" | xargs chmod +x || true
      chmod +x "$installerPath" || true

      # Esperar a que el host ESXi responda antes de intentar la instalación
      IPDestino="${var.esxi_deploy_host}"
      PuertoSSH=22
      SegundosEspera=10
      Comienzo="$(date +%s)"
      echo "Esperando a que el host ESXi $IPDestino acepte conexiones en el puerto SSH..."
      while true; do
        if timeout 5 bash -c ">/dev/tcp/$IPDestino/$PuertoSSH" >/dev/null 2>&1; then
          echo "[OK] ¡El equipo $IPDestino acepta conexiones en el puerto $PuertoSSH!"
          break
        fi
        TiempoActual="$(date +%s)"
        if [ $((TiempoActual - Comienzo)) -ge 180 ]; then
          echo "Tiempo de espera agotado. El host ESXi $IPDestino no respondió en el puerto SSH después de 3 minutos."
          exit 1
        fi
        TiempoActual="$(date +%H:%M:%S)"
        echo "[$TiempoActual] Sin respuesta en puerto $PuertoSSH de $IPDestino. Reintentando en $SegundosEspera segundos..."
        sleep "$SegundosEspera"
      done

      echo "Ejecutando instalador en $installerPath ..."
      "$installerPath" install --no-ssl-certificate-verification --no-esx-ssl-verify --accept-eula --acknowledge-ceip "$jsonPath"

      echo "vCenter instalado exitosamente."
    EOT
    interpreter = ["/bin/bash", "-c"]
  }
}

