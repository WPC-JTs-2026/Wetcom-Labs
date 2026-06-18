import { spawn } from "child_process"
import { promises as fs } from "fs"
import path from "path"

export interface DeployState {
  status: "idle" | "running" | "completed" | "failed" | "canceled"
  stage: string
  logs: string[]
  currentStep: number
  totalSteps: number
  progress: number
}

/** Fields that must be present and non-empty before any deployment starts. */
const REQUIRED_FIELDS = [
  "vsphere_user",
  "vsphere_password",
  "network_name",
  "vm_folder_path",
  "vm_domain",
] as const

class DeploymentManager {
  private state: DeployState = {
    status: "idle",
    stage: "",
    logs: [],
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
  }

  private currentProcess: any = null
  private cancelRequested = false

  getState(): DeployState {
    return this.state
  }

  clearLogs() {
    this.state.logs = []
    this.state.progress = 0
  }

  private addLog(text: string) {
    // Strip ANSI escape codes from Terraform / shell output
    const cleanText = text.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      "",
    )
    this.state.logs.push(cleanText)
    // Keep logs size reasonable
    if (this.state.logs.length > 2000) {
      this.state.logs.shift()
    }
  }

  cancel() {
    if (this.state.status === "running" && this.currentProcess) {
      this.cancelRequested = true
      this.addLog("\n[SYSTEM] Cancelación solicitada por el usuario...")

      // On Windows, taskkill is needed to kill the whole process tree
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", this.currentProcess.pid, "/f", "/t"])
      } else {
        this.currentProcess.kill("SIGINT")
      }

      this.state.status = "canceled"
    }
  }

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------
  async startDeployment(milestoneId: string, customConfig?: any) {
    if (this.state.status === "running") {
      throw new Error("Ya hay un despliegue en ejecución.")
    }

    this.state.status = "running"
    this.state.logs = []
    this.state.progress = 0
    this.cancelRequested = false

    // ── Load global settings ────────────────────────────────────────────
    let settings: Record<string, any> = {}
    try {
      const settingsPath = path.join(
        process.cwd(),
        "..",
        "terraform",
        "global.tfvars.json",
      )
      const rawSettings = await fs.readFile(settingsPath, "utf8")
      const parsed = JSON.parse(rawSettings)
      
      // Flatten helper
      const flatten = (obj: any): any => {
        let res: any = {}
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(res, flatten(obj[key]))
            } else {
              res[key] = obj[key]
            }
          }
        }
        return res
      }
      settings = flatten(parsed)
    } catch {
      this.addLog(
        "[WARNING] No se encontró global.tfvars.json. Usando valores por defecto.",
      )
    }

    // ── Validate required fields ────────────────────────────────────────
    const missing = REQUIRED_FIELDS.filter(
      (f) => !settings[f] || String(settings[f]).trim() === "",
    )
    if (missing.length > 0) {
      this.state.status = "failed"
      const msg = `Faltan campos obligatorios en la configuración global: ${missing.join(", ")}`
      this.addLog(`[ERROR] ${msg}`)
      throw new Error(msg)
    }

    // ── Convenience derived values ──────────────────────────────────────
    const subnet = settings.esxi_ip_subnet || "10.106.3"
    const offset = Number(settings.esxi_ip_start_offset) || 201
    const esxiPassword = settings.esxi_password || "Wetcom01!"

    try {
      // ================================================================
      // Milestone f1-m1 — Stage 1 + Stage 2
      // ================================================================
      if (milestoneId === "f1-m1") {
        this.state.totalSteps = 2

        // ── STEP 1 — Stage 1: Deploy Nested ESXi + TrueNAS ─────────
        this.state.currentStep = 1
        this.state.stage = "Stage 1: Despliegue de ESXi y TrueNAS"
        this.state.progress = 10
        this.addLog(
          `=== [Paso 1 de 2] Iniciando ${this.state.stage} ===`,
        )

        const s1Vars = {
          vsphere_server:
            settings.vsphere_server || "vcenter-001.playground.net",
          vsphere_user: settings.vsphere_user,
          vsphere_password: settings.vsphere_password,
          datacenter_name: settings.datacenter_name || "Playground",
          cluster_name: settings.cluster_name || "Cluster-001",
          datastore_name: settings.datastore_name || "vSanDatastore",
          network_name: settings.network_name,
          resource_pool_name: settings.resource_pool_name || "WPC",
          vm_folder_path: settings.vm_folder_path,
          vm_domain: settings.vm_domain,
          esxi_ovf_local_path:
            settings.esxi_ovf_local_path ||
            ".templates/wpc-esxi-8u3-template.ova",
          esxi_deploy_host:
            settings.esxi_deploy_host || "esxi-04.playground.net",
          esxi_count: 2,
          esxi_name_prefix: settings.esxi_name_prefix || "tf-esxi",
          esxi_cpu_count: settings.esxi_cpu_count || 4,
          esxi_memory_mb: settings.esxi_memory_mb || 8192,
          esxi_disk_size_gb: settings.esxi_disk_size_gb || 200,
          esxi_ip_start_offset: offset,
          esxi_ip_subnet: subnet,
          esxi_netmask: "255.255.255.0",
          esxi_gateway: settings.esxi_gateway || `${subnet}.1`,
          esxi_dns: settings.esxi_dns || `${subnet}.1`,
          esxi_password: esxiPassword,
          esxi_ssh_enabled: true,
          deploy_truenas: true,
          truenas_template_name:
            settings.truenas_template_name ||
            "truenas-template.playground.net",
          truenas_vm_prefix: settings.truenas_vm_prefix || "truenas-lab",
          truenas_vm_cpus: settings.truenas_vm_cpus || 2,
          truenas_vm_memory: settings.truenas_vm_memory || 8192,
          truenas_vm_ip: settings.truenas_vm_ip || `${subnet}.210`,
          truenas_vm_netmask: 24,
          truenas_vm_gateway: settings.esxi_gateway || `${subnet}.1`,
        }

        const s1Path = path.join(
          process.cwd(),
          "..",
          "terraform",
          "stage1",
        )
        await fs.writeFile(
          path.join(s1Path, "terraform.tfvars.json"),
          JSON.stringify(s1Vars, null, 2),
        )

        this.addLog("[SYSTEM] Ejecutando terraform init...")
        await this.runCommand("terraform", ["init"], s1Path)
        if (this.cancelRequested) return

        this.addLog("[SYSTEM] Ejecutando terraform apply...")
        await this.runCommand(
          "terraform",
          ["apply", "-auto-approve"],
          s1Path,
        )
        if (this.cancelRequested) return
        this.state.progress = 50

        // ── STEP 2 — Stage 2: Install VCSA ─────────────────────────
        this.state.currentStep = 2
        this.state.stage = "Stage 2: Instalación de vCenter Server (VCSA)"
        this.addLog(
          `\n=== [Paso 2 de 2] Iniciando ${this.state.stage} ===`,
        )

        const s2Vars = {
          esxi_deploy_host: `${subnet}.${offset}`,
          esxi_password: esxiPassword,
          vcsa_netmask: "255.255.255.0",
          vcsa_gateway: settings.esxi_gateway || `${subnet}.1`,
          vcsa_dns:
            settings.vcsa_dns || settings.esxi_dns || `${subnet}.1`,
          vcsa_ip: settings.vcsa_ip || `${subnet}.200`,
          vcsa_fqdn: settings.vcsa_ip || `${subnet}.200`,
          vcsa_password: settings.vcsa_password || "Wetcom01!",
          vcsa_exctract_path:
            settings.vcsa_exctract_path || "/home/wpc/vcsa_iso_extract",
        }

        const s2Path = path.join(
          process.cwd(),
          "..",
          "terraform",
          "stage2",
        )
        await fs.writeFile(
          path.join(s2Path, "terraform.tfvars.json"),
          JSON.stringify(s2Vars, null, 2),
        )

        this.addLog("[SYSTEM] Ejecutando terraform init...")
        await this.runCommand("terraform", ["init"], s2Path)
        if (this.cancelRequested) return

        this.addLog("[SYSTEM] Ejecutando terraform apply...")
        await this.runCommand(
          "terraform",
          ["apply", "-auto-approve"],
          s2Path,
        )
        if (this.cancelRequested) return

        this.state.progress = 100
        this.state.status = "completed"
        this.addLog(
          "\n=== ¡Despliegue de Milestone 1 Finalizado con Éxito! ===",
        )

        // ================================================================
        // Milestone f1-m2 — Stage 3
        // ================================================================
      } else if (milestoneId === "f1-m2") {
        this.state.totalSteps = 1
        this.state.currentStep = 1
        this.state.stage =
          "Stage 3: Configuración de Datastores iSCSI y NFS"
        this.state.progress = 10
        this.addLog(
          `=== [Paso 1 de 1] Iniciando ${this.state.stage} ===`,
        )

        const s3Vars = {
          vsphere_server: settings.vcsa_ip || `${subnet}.200`,
          vsphere_user: "administrator@vsphere.local",
          vsphere_password: settings.vcsa_password || "Wetcom01!",
          datacenter_name: "Datacenter-001",
          cluster_name: "Cluster-001",
          hosts_info: [
            {
              user: "root",
              password: esxiPassword,
              address: `${subnet}.${offset}`,
            },
            {
              user: "root",
              password: esxiPassword,
              address: `${subnet}.${offset + 1}`,
            },
          ],
          iscsi_enabled: true,
          truenas_ip: settings.truenas_vm_ip || `${subnet}.210`,
          truenas_chap_user: settings.truenas_chap_user || "iscsi_user",
          truenas_chap_pass:
            settings.truenas_chap_pass || "SecureChapPass123!",
          vswitch_name: settings.vswitch_name || "vSwitch-Storage",
          vswitch_uplink: settings.vswitch_uplink || "vmnic1",
          network_portgroup:
            settings.network_portgroup || "PortGroup-iSCSI",
          vmkernel_interface:
            settings.vmkernel_interface || "vmk1",
          iscsi_network_config: [
            {
              host_address: `${subnet}.${offset}`,
              iscsi_ip: `${subnet}.${offset + 2}`,
              iscsi_netmask: "255.255.255.0",
            },
            {
              host_address: `${subnet}.${offset + 1}`,
              iscsi_ip: `${subnet}.${offset + 3}`,
              iscsi_netmask: "255.255.255.0",
            },
          ],
          nfs_enabled: true,
          nfs_datastore_name:
            settings.nfs_datastore_name || "TrueNAS-NFS-DS",
          nfs_remote_path:
            settings.nfs_remote_path || "/mnt/pool-almacenamiento",
          nfs_access_mode: "readWrite",
        }

        const s3Path = path.join(
          process.cwd(),
          "..",
          "terraform",
          "stage3",
        )
        await fs.writeFile(
          path.join(s3Path, "terraform.tfvars.json"),
          JSON.stringify(s3Vars, null, 2),
        )

        this.addLog("[SYSTEM] Ejecutando terraform init...")
        await this.runCommand("terraform", ["init"], s3Path)
        if (this.cancelRequested) return

        this.addLog("[SYSTEM] Ejecutando terraform apply...")
        await this.runCommand(
          "terraform",
          ["apply", "-auto-approve"],
          s3Path,
        )
        if (this.cancelRequested) return

        this.state.progress = 100
        this.state.status = "completed"
        this.addLog(
          "\n=== ¡Despliegue de Milestone 2 Finalizado con Éxito! ===",
        )

        // ================================================================
        // Custom milestone — frontend form overrides
        // ================================================================
      } else if (milestoneId === "custom" && customConfig) {
        this.state.totalSteps = 1
        this.state.currentStep = 1
        this.state.stage = `Custom Deploy: ${customConfig.name}`
        this.state.progress = 10
        this.addLog(
          `=== Iniciando despliegue personalizado para: ${customConfig.name} ===`,
        )

        // Build stage-1 vars from global settings, then let customConfig
        // override any values the user specified in the form.
        const s1Vars: Record<string, any> = {
          vsphere_server:
            settings.vsphere_server || "vcenter-001.playground.net",
          vsphere_user: settings.vsphere_user,
          vsphere_password: settings.vsphere_password,
          datacenter_name: settings.datacenter_name || "Playground",
          cluster_name: settings.cluster_name || "Cluster-001",
          datastore_name: settings.datastore_name || "vSanDatastore",
          network_name: settings.network_name,
          resource_pool_name: settings.resource_pool_name || "WPC",
          vm_folder_path: settings.vm_folder_path,
          vm_domain: settings.vm_domain,
          esxi_ovf_local_path:
            settings.esxi_ovf_local_path ||
            ".templates/wpc-esxi-8u3-template.ova",
          esxi_deploy_host:
            settings.esxi_deploy_host || "esxi-04.playground.net",
          esxi_count: customConfig.esxiHosts?.length ?? 2,
          esxi_name_prefix:
            customConfig.esxiHosts?.[0]?.name?.replace(/-\d+$/, "") ||
            settings.esxi_name_prefix ||
            "tf-esxi",
          esxi_cpu_count:
            customConfig.esxiHosts?.[0]?.cpu ||
            settings.esxi_cpu_count ||
            4,
          esxi_memory_mb:
            customConfig.esxiHosts?.[0]?.ram
              ? customConfig.esxiHosts[0].ram * 1024
              : settings.esxi_memory_mb || 8192,
          esxi_disk_size_gb:
            customConfig.esxiHosts?.[0]?.disks?.[0]?.size ||
            settings.esxi_disk_size_gb ||
            200,
          esxi_ip_start_offset: offset,
          esxi_ip_subnet: subnet,
          esxi_netmask: "255.255.255.0",
          esxi_gateway: settings.esxi_gateway || `${subnet}.1`,
          esxi_dns: settings.esxi_dns || `${subnet}.1`,
          esxi_password: esxiPassword,
          esxi_ssh_enabled: true,
          deploy_truenas: customConfig.truenas?.enabled ?? true,
          truenas_template_name:
            settings.truenas_template_name ||
            "truenas-template.playground.net",
          truenas_vm_prefix:
            settings.truenas_vm_prefix || "truenas-lab",
          truenas_vm_cpus: settings.truenas_vm_cpus || 2,
          truenas_vm_memory: settings.truenas_vm_memory || 8192,
          truenas_vm_ip: settings.truenas_vm_ip || `${subnet}.210`,
          truenas_vm_netmask: 24,
          truenas_vm_gateway: settings.esxi_gateway || `${subnet}.1`,
        }

        // Adjust TrueNAS memory when large storage is requested
        if (
          customConfig.truenas?.enabled &&
          customConfig.truenas?.storage > 1000
        ) {
          s1Vars.truenas_vm_memory = 16384
        }

        // Let any explicit customConfig overrides win
        if (customConfig.overrides) {
          Object.assign(s1Vars, customConfig.overrides)
        }

        const s1Path = path.join(
          process.cwd(),
          "..",
          "terraform",
          "stage1",
        )
        await fs.writeFile(
          path.join(s1Path, "terraform.tfvars.json"),
          JSON.stringify(s1Vars, null, 2),
        )

        this.addLog("[SYSTEM] Ejecutando terraform init...")
        await this.runCommand("terraform", ["init"], s1Path)
        if (this.cancelRequested) return

        this.addLog("[SYSTEM] Ejecutando terraform apply...")
        await this.runCommand(
          "terraform",
          ["apply", "-auto-approve"],
          s1Path,
        )
        if (this.cancelRequested) return

        this.state.progress = 100
        this.state.status = "completed"
        this.addLog(
          "\n=== ¡Despliegue Personalizado Finalizado con Éxito! ===",
        )
      } else {
        throw new Error(`Milestone no soportado: ${milestoneId}`)
      }
    } catch (error: any) {
      if (this.cancelRequested) {
        this.state.status = "canceled"
        this.addLog("\n[SYSTEM] Proceso cancelado.")
      } else {
        this.state.status = "failed"
        this.addLog(`\n[ERROR] El despliegue falló: ${error.message}`)
      }
    } finally {
      this.currentProcess = null
    }
  }

  // ---------------------------------------------------------------------------
  // Shell helper — spawns a process and streams output into logs
  // ---------------------------------------------------------------------------
  private runCommand(
    cmd: string,
    args: string[],
    cwd: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.addLog(`> ${cmd} ${args.join(" ")}`)

      const p = spawn(cmd, args, {
        cwd,
        env: { ...process.env, PAGER: "cat" },
      })

      this.currentProcess = p

      p.stdout.on("data", (data) => {
        this.addLog(data.toString())
      })

      p.stderr.on("data", (data) => {
        this.addLog(`[STDERR] ${data.toString()}`)
      })

      p.on("close", (code) => {
        this.currentProcess = null
        if (code === 0) {
          resolve()
        } else {
          reject(
            new Error(`Comando finalizó con código de salida ${code}`),
          )
        }
      })

      p.on("error", (err) => {
        this.currentProcess = null
        reject(err)
      })
    })
  }
}

// Global singleton instance (survives HMR in development)
const globalForDeployment = global as unknown as {
  deploymentManager: DeploymentManager
}
export const deploymentManager =
  globalForDeployment.deploymentManager || new DeploymentManager()

if (process.env.NODE_ENV !== "production") {
  globalForDeployment.deploymentManager = deploymentManager
}
