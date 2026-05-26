export interface DiskConfig {
  id: string
  name: string
  size: number // en GB
}

export interface NetworkConfig {
  mode: "dhcp" | "static"
  ipAddress: string
  gateway: string
  subnetMask: string
  dns1: string
  dns2: string
}

export interface ESXiHostConfig {
  id: string
  name: string
  version: string
  cpu: number
  ram: number // en GB
  disks: DiskConfig[]
  network: NetworkConfig
}

export interface VCenterConfig {
  enabled: boolean
  version: string
  network: NetworkConfig
}

export interface TrueNASConfig {
  enabled: boolean
  version: string
  storage: number
  protocols: string[]
  network: NetworkConfig
}

export interface WindowsServerConfig {
  id: string
  name: string
  version: string
  role: string
  cpu: number
  ram: number
  network: NetworkConfig
}

export interface CustomDeploymentConfig {
  name: string
  description: string
  vcenter: VCenterConfig
  esxiHosts: ESXiHostConfig[]
  truenas: TrueNASConfig
  windowsServers: WindowsServerConfig[]
}

export const ESXI_VERSIONS = [
  { value: "8.0U3", label: "ESXi 8.0 Update 3" },
  { value: "8.0U2", label: "ESXi 8.0 Update 2" },
  { value: "8.0U1", label: "ESXi 8.0 Update 1" },
  { value: "7.0U3", label: "ESXi 7.0 Update 3" },
  { value: "7.0U2", label: "ESXi 7.0 Update 2" },
]

export const VCENTER_VERSIONS = [
  { value: "8.0U3", label: "vCenter Server 8.0 Update 3" },
  { value: "8.0U2", label: "vCenter Server 8.0 Update 2" },
  { value: "8.0U1", label: "vCenter Server 8.0 Update 1" },
  { value: "7.0U3", label: "vCenter Server 7.0 Update 3" },
]

export const TRUENAS_VERSIONS = [
  { value: "13.0-U6", label: "TrueNAS CORE 13.0-U6" },
  { value: "13.0-U5", label: "TrueNAS CORE 13.0-U5" },
  { value: "SCALE-24.04", label: "TrueNAS SCALE 24.04" },
  { value: "SCALE-23.10", label: "TrueNAS SCALE 23.10" },
]

export const WINDOWS_SERVER_VERSIONS = [
  { value: "2022", label: "Windows Server 2022" },
  { value: "2019", label: "Windows Server 2019" },
  { value: "2016", label: "Windows Server 2016" },
]

export const WINDOWS_SERVER_ROLES = [
  { value: "AD", label: "Active Directory Domain Controller" },
  { value: "DNS", label: "DNS Server" },
  { value: "DHCP", label: "DHCP Server" },
  { value: "FILE", label: "File Server" },
  { value: "IIS", label: "Web Server (IIS)" },
  { value: "NONE", label: "Sin rol (Base)" },
]

export const CPU_OPTIONS = [
  { value: 2, label: "2 vCPUs" },
  { value: 4, label: "4 vCPUs" },
  { value: 8, label: "8 vCPUs" },
  { value: 16, label: "16 vCPUs" },
]

export const TRUENAS_PROTOCOLS = [
  { value: "NFS", label: "NFS", description: "Network File System" },
  { value: "iSCSI", label: "iSCSI", description: "Internet Small Computer Systems Interface" },
  { value: "SMB", label: "SMB/CIFS", description: "Server Message Block" },
  { value: "FTP", label: "FTP", description: "File Transfer Protocol" },
  { value: "SFTP", label: "SFTP", description: "SSH File Transfer Protocol" },
  { value: "WebDAV", label: "WebDAV", description: "Web Distributed Authoring" },
]

export function createDefaultNetworkConfig(): NetworkConfig {
  return {
    mode: "dhcp",
    ipAddress: "",
    gateway: "",
    subnetMask: "255.255.255.0",
    dns1: "",
    dns2: "",
  }
}

export function createDefaultDisk(index: number): DiskConfig {
  return {
    id: crypto.randomUUID(),
    name: `disk-${index}`,
    size: 100,
  }
}

export function createDefaultHost(index: number): ESXiHostConfig {
  return {
    id: crypto.randomUUID(),
    name: `esxi-host-${index.toString().padStart(2, "0")}`,
    version: "8.0U3",
    cpu: 4,
    ram: 32,
    disks: [createDefaultDisk(1)],
    network: createDefaultNetworkConfig(),
  }
}

export function createDefaultWindowsServer(index: number): WindowsServerConfig {
  return {
    id: crypto.randomUUID(),
    name: `win-server-${index.toString().padStart(2, "0")}`,
    version: "2022",
    role: "AD",
    cpu: 4,
    ram: 8,
    network: createDefaultNetworkConfig(),
  }
}

export function cloneHost(host: ESXiHostConfig, newIndex: number): ESXiHostConfig {
  return {
    ...host,
    id: crypto.randomUUID(),
    name: `esxi-host-${newIndex.toString().padStart(2, "0")}`,
    disks: host.disks.map((disk) => ({
      ...disk,
      id: crypto.randomUUID(),
    })),
    network: { ...host.network },
  }
}

export function cloneWindowsServer(server: WindowsServerConfig, newIndex: number): WindowsServerConfig {
  return {
    ...server,
    id: crypto.randomUUID(),
    name: `win-server-${newIndex.toString().padStart(2, "0")}`,
    network: { ...server.network },
  }
}

export function createDefaultConfig(): CustomDeploymentConfig {
  return {
    name: "",
    description: "",
    vcenter: {
      enabled: true,
      version: "8.0U3",
      network: createDefaultNetworkConfig(),
    },
    esxiHosts: [createDefaultHost(1)],
    truenas: {
      enabled: false,
      version: "13.0-U6",
      storage: 1000,
      protocols: [],
      network: createDefaultNetworkConfig(),
    },
    windowsServers: [],
  }
}

export function calculateHostStorage(host: ESXiHostConfig): number {
  return host.disks.reduce((sum, disk) => sum + disk.size, 0)
}
