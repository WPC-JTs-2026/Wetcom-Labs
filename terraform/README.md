# Wetcom Labs

## Uso
El siguiente paso a paso debe realizarse en una máquina virtual o física en la misma red del vCenter (o con acceso al mismo).

### Instalación de requerimientos
1. [Instalar Chocolatey](https://chocolatey.org/)
2. Instalar Terraform y Packer
```
# Windows
choco install terraform packer git vscode -y

# Linux
sudo apt install terraform packer git
```

### Preparación del entorno
Para que el sistema funcione se deberán ingresar un conjunto de variables (ver ``variables.tf``).

Para asignarle valores, podemos hacerlo por consola o declarando los valores en un archivo.

Para crear el archivo, podemos tomar como ejemplo ``terraform.tfvars.json.example``. Recomendamos copiar el archivo y cambiar el nombre a ``terraform.tfvars.json`` para ingresar los valores propios y no pushearlos por accidente al repositorio.

## Cómo funciona el proyecto
Este proyecto organiza la infraestructura en tres etapas de Terraform dentro de la carpeta `terraform/`.

- `terraform/stage1/`: prepara la infraestructura base y genera recursos iniciales necesarios para el resto del despliegue.
- `terraform/stage2/`: define los recursos y máquinas virtuales que dependen de lo creado en `stage1`.
- `terraform/stage3/`: configura el almacenamiento de datos con iSCSI y NFS sobre la infraestructura provisionada.

Cada stage tiene su propio conjunto de archivos `.tf`, variables y estado local. El flujo típico es:

1. Ejecutar `terraform init` en el directorio de la etapa para descargar proveedores y preparar el workspace local.
2. Ejecutar `terraform plan` para revisar cambios antes de aplicar.
3. Ejecutar `terraform apply` para crear o actualizar recursos en vCenter.

Las variables se definen en los archivos `variables.tf` de cada etapa y se cargan desde `terraform.tfvars.json`. El archivo `global.tfvars.json` en la raíz puede contener valores comunes o adicionales que se usan en el despliegue.

## Estructura del proyecto
A continuación se muestra la estructura de archivos de `terraform/`, excluyendo los archivos ignorados por `.gitignore` y manteniendo los archivos `terraform.tfvars.json` cuando existen.

```
terraform/
├── README.md
├── deploy.sh
├── global.tfvars.json
├── stage1/
│   ├── data.tf                # definición de data sources e información importada de vCenter
│   ├── main.tf                # recursos principales de la infraestructura base
│   ├── providers.tf           # configuración del proveedor vSphere y autenticación
│   ├── terraform.tfvars.json  # valores de variables específicos de la etapa
│   ├── truenas.tf             # recursos relacionados con Truenas o almacenamiento inicial
│   └── variables.tf           # declaración de variables para stage1
├── stage2/
│   ├── main.tf                # recursos dependientes de la infraestructura de stage1
│   ├── terraform.tfvars.json  # valores de variables específicos de stage2
│   └── variables.tf           # declaración de variables para stage2
└── stage3/
    ├── iscsi.tf               # definición de recursos iSCSI y volúmenes de almacenamiento
    ├── main.tf                # recursos y dependencias principales de stage3
    ├── nfs.tf                 # configuración de exportaciones NFS y permisos
    ├── providers.tf           # configuración del proveedor vSphere para stage3
    ├── terraform.tfvars.json  # valores de variables específicos de stage3
    └── variables.tf           # declaración de variables para stage3
```

### Instalación de dependencias de Terraform
Se deeb descargar los binarios del provider de vSphere y configurar el directorio de trabajo local `.terraform` (no se debe pushear al repositorio).
```
terraform init
```

### Ejecución
Primeramente podemos realizar una lectura del estado actual de vSphere, compararlo con el código HCL y mostrar un plan de ejecución determinista sin alterar el entorno.
```
# Para ingresar las variables por línea de comandos
terraform plan

# Para utilizar las variables del archivo terraform.tfvars.json
terraform plan -var-file=terraform.tfvars.json
```

Luego, para consolidar los cambios:
``` 
# Para ingresar las variables por línea de comandos
terraform apply

# Para utilizar las variables del archivo terraform.tfvars.json
terraform apply -var-file=terraform.tfvars.json
```
Luego de ejecutar `terraform apply`, se consolidarán los cambios ejecutando de forma ordenada las llamadas API contra vCenter. También se genera el archivo local terraform.tfstate.
'''

# Documentación Útil

- [vSphere Provider For Terraform](https://registry.terraform.io/providers/hashicorp/vsphere/latest/docs)

# Data NSX
![alt text](image.png)
