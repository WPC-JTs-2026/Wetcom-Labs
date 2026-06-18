import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const SETTINGS_PATH = path.join(process.cwd(), "..", "terraform", "global.tfvars.json")

// All settings with their defaults
const DEFAULT_SETTINGS: Record<string, any> = {
  // Playground connection
  vsphere_server: "vcenter-001.playground.net",
  vsphere_user: "",
  vsphere_password: "",

  // Lab identity
  network_name: "",
  vm_folder_path: "",
  vm_domain: "",
  esxi_ip_subnet: "10.106.3",
  esxi_ip_start_offset: 201,
  esxi_gateway: "",
  esxi_dns: "",

  // IPs and passwords
  vcsa_ip: "",
  truenas_vm_ip: "",
  esxi_password: "Wetcom01!",
  vcsa_password: "Wetcom01!",
  vcsa_dns: "",
  truenas_chap_user: "iscsi_user",
  truenas_chap_pass: "SecureChapPass123!",

  // Advanced defaults
  datacenter_name: "Playground",
  cluster_name: "Cluster-001",
  datastore_name: "vSanDatastore",
  resource_pool_name: "WPC",
  esxi_deploy_host: "esxi-04.playground.net",
  esxi_name_prefix: "tf-esxi",
  esxi_cpu_count: 4,
  esxi_memory_mb: 8192,
  esxi_disk_size_gb: 200,
  truenas_template_name: "truenas-template.playground.net",
  truenas_vm_prefix: "truenas-lab",
  truenas_vm_cpus: 2,
  truenas_vm_memory: 8192,
  vswitch_name: "vSwitch-Storage",
  vswitch_uplink: "vmnic1",
  network_portgroup: "PortGroup-iSCSI",
  vmkernel_interface: "vmk1",
  nfs_datastore_name: "TrueNAS-NFS-DS",
  nfs_remote_path: "/mnt/pool-almacenamiento",
}

function flattenObject(obj: any): any {
  let res: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(res, flattenObject(obj[key]))
      } else {
        res[key] = obj[key]
      }
    }
  }
  return res
}

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, "utf8")
    const saved = JSON.parse(data)
    const flatSaved = flattenObject(saved)
    // Merge defaults with saved values (saved takes priority)
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...flatSaved })
  } catch (error) {
    // Return defaults if file doesn't exist yet
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(body, null, 2), "utf8")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
