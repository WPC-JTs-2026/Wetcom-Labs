"use client"

import { useState } from "react"
import { Plus, Trash2, Server, Database, Monitor, HardDrive, Copy, Network, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { DeploymentTerminal } from "@/components/deployment-terminal"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type CustomDeploymentConfig,
  type ESXiHostConfig,
  type DiskConfig,
  type WindowsServerConfig,
  type NetworkConfig,
  ESXI_VERSIONS,
  VCENTER_VERSIONS,
  TRUENAS_VERSIONS,
  TRUENAS_PROTOCOLS,
  WINDOWS_SERVER_VERSIONS,
  WINDOWS_SERVER_ROLES,
  CPU_OPTIONS,
  createDefaultHost,
  createDefaultConfig,
  createDefaultDisk,
  createDefaultWindowsServer,
  createDefaultNetworkConfig,
  cloneHost,
  cloneWindowsServer,
  calculateHostStorage,
} from "@/lib/custom-deployment"

// Componente reutilizable para configuracion de red por componente
function NetworkConfigPanel({
  network,
  onChange,
  componentName,
}: {
  network: NetworkConfig
  onChange: (network: NetworkConfig) => void
  componentName: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Configuracion de Red</span>
          <Badge variant={network.mode === "dhcp" ? "secondary" : "outline"} className="text-xs">
            {network.mode === "dhcp" ? "DHCP" : network.ipAddress || "IP Estatica"}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm">Modo:</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={network.mode === "dhcp" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...network, mode: "dhcp" })}
              >
                DHCP
              </Button>
              <Button
                type="button"
                variant={network.mode === "static" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...network, mode: "static" })}
              >
                IP Estatica
              </Button>
            </div>
          </div>

          {network.mode === "static" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Direccion IP</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={network.ipAddress}
                  onChange={(e) => onChange({ ...network, ipAddress: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mascara de Subred</Label>
                <Input
                  placeholder="255.255.255.0"
                  value={network.subnetMask}
                  onChange={(e) => onChange({ ...network, subnetMask: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gateway</Label>
                <Input
                  placeholder="192.168.1.1"
                  value={network.gateway}
                  onChange={(e) => onChange({ ...network, gateway: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DNS Primario</Label>
                <Input
                  placeholder="8.8.8.8"
                  value={network.dns1}
                  onChange={(e) => onChange({ ...network, dns1: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DNS Secundario</Label>
                <Input
                  placeholder="8.8.4.4"
                  value={network.dns2}
                  onChange={(e) => onChange({ ...network, dns2: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para item de disco
function DiskItem({
  disk,
  index,
  canDelete,
  onUpdate,
  onDelete,
}: {
  disk: DiskConfig
  index: number
  canDelete: boolean
  onUpdate: (id: string, updates: Partial<DiskConfig>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={disk.name}
            onChange={(e) => onUpdate(disk.id, { name: e.target.value })}
            placeholder={`disk-${index + 1}`}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Capacidad (GB)</Label>
          <Input
            type="number"
            min={1}
            value={disk.size}
            onChange={(e) => onUpdate(disk.id, { size: parseInt(e.target.value) || 0 })}
            placeholder="100"
            className="h-8"
          />
        </div>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(disk.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Componente para Host ESXi
function ESXiHostCard({
  host,
  index,
  canDelete,
  onUpdate,
  onDelete,
  onClone,
}: {
  host: ESXiHostConfig
  index: number
  canDelete: boolean
  onUpdate: (id: string, updates: Partial<ESXiHostConfig>) => void
  onDelete: (id: string) => void
  onClone: (host: ESXiHostConfig) => void
}) {
  const [expanded, setExpanded] = useState(index === 0)

  const updateDisk = (diskId: string, updates: Partial<DiskConfig>) => {
    onUpdate(host.id, {
      disks: host.disks.map((d) => (d.id === diskId ? { ...d, ...updates } : d)),
    })
  }

  const addDisk = () => {
    onUpdate(host.id, {
      disks: [...host.disks, createDefaultDisk(host.disks.length + 1)],
    })
  }

  const deleteDisk = (diskId: string) => {
    onUpdate(host.id, {
      disks: host.disks.filter((d) => d.id !== diskId),
    })
  }

  const totalStorage = calculateHostStorage(host)
  const networkInfo = host.network.mode === "dhcp" ? "DHCP" : host.network.ipAddress || "IP Estatica"

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 text-left flex-1"
          >
            <Server className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{host.name}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                {host.version} | {host.cpu} vCPU | {host.ram} GB RAM | {totalStorage} GB | {networkInfo}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClone(host)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary-foreground hover:bg-primary"
              title="Clonar configuracion"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(host.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Nombre del Host</Label>
              <Input
                value={host.name}
                onChange={(e) => onUpdate(host.id, { name: e.target.value })}
                placeholder="esxi-host-01"
              />
            </div>
            <div className="space-y-2">
              <Label>Version ESXi</Label>
              <Select
                value={host.version}
                onValueChange={(value) => onUpdate(host.id, { version: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESXI_VERSIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CPU</Label>
              <Select
                value={host.cpu.toString()}
                onValueChange={(value) => onUpdate(host.id, { cpu: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CPU_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Memoria RAM (GB)</Label>
              <Input
                type="number"
                min={1}
                value={host.ram}
                onChange={(e) => onUpdate(host.id, { ram: parseInt(e.target.value) || 0 })}
                placeholder="32"
              />
            </div>
          </div>

          {/* Discos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Discos ({host.disks.length}) - Total: {totalStorage} GB
              </Label>
              <Button variant="outline" size="sm" onClick={addDisk} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                Agregar Disco
              </Button>
            </div>
            <div className="space-y-2">
              {host.disks.map((disk, diskIndex) => (
                <DiskItem
                  key={disk.id}
                  disk={disk}
                  index={diskIndex}
                  canDelete={host.disks.length > 1}
                  onUpdate={updateDisk}
                  onDelete={deleteDisk}
                />
              ))}
            </div>
          </div>

          {/* Configuracion de Red */}
          <NetworkConfigPanel
            network={host.network}
            onChange={(network) => onUpdate(host.id, { network })}
            componentName={host.name}
          />
        </CardContent>
      )}
    </Card>
  )
}

// Componente para Windows Server
function WindowsServerCard({
  server,
  index,
  onUpdate,
  onDelete,
  onClone,
}: {
  server: WindowsServerConfig
  index: number
  onUpdate: (id: string, updates: Partial<WindowsServerConfig>) => void
  onDelete: (id: string) => void
  onClone: (server: WindowsServerConfig) => void
}) {
  const [expanded, setExpanded] = useState(index === 0)

  const roleLabel = WINDOWS_SERVER_ROLES.find((r) => r.value === server.role)?.label || server.role
  const networkInfo = server.network.mode === "dhcp" ? "DHCP" : server.network.ipAddress || "IP Estatica"

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 text-left flex-1"
          >
            <Monitor className="h-5 w-5 text-blue-500" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{server.name}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                WS {server.version} | {roleLabel} | {server.cpu} vCPU | {server.ram} GB RAM | {networkInfo}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClone(server)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary-foreground hover:bg-primary"
              title="Clonar configuracion"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(server.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombre del Servidor</Label>
              <Input
                value={server.name}
                onChange={(e) => onUpdate(server.id, { name: e.target.value })}
                placeholder="win-server-01"
              />
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <Select
                value={server.version}
                onValueChange={(value) => onUpdate(server.id, { version: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOWS_SERVER_VERSIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={server.role}
                onValueChange={(value) => onUpdate(server.id, { role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOWS_SERVER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CPU</Label>
              <Select
                value={server.cpu.toString()}
                onValueChange={(value) => onUpdate(server.id, { cpu: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CPU_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Memoria RAM (GB)</Label>
              <Input
                type="number"
                min={1}
                value={server.ram}
                onChange={(e) => onUpdate(server.id, { ram: parseInt(e.target.value) || 0 })}
                placeholder="8"
              />
            </div>
          </div>

          {/* Configuracion de Red */}
          <NetworkConfigPanel
            network={server.network}
            onChange={(network) => onUpdate(server.id, { network })}
            componentName={server.name}
          />
        </CardContent>
      )}
    </Card>
  )
}

export function CustomDeploymentForm() {
  const [config, setConfig] = useState<CustomDeploymentConfig>(createDefaultConfig())
  const [terminalOpen, setTerminalOpen] = useState(false)


  const updateConfig = <K extends keyof CustomDeploymentConfig>(
    key: K,
    value: CustomDeploymentConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  // ESXi Hosts
  const addHost = () => {
    const newHost = createDefaultHost(config.esxiHosts.length + 1)
    updateConfig("esxiHosts", [...config.esxiHosts, newHost])
  }

  const updateHost = (id: string, updates: Partial<ESXiHostConfig>) => {
    updateConfig(
      "esxiHosts",
      config.esxiHosts.map((h) => (h.id === id ? { ...h, ...updates } : h))
    )
  }

  const deleteHost = (id: string) => {
    updateConfig(
      "esxiHosts",
      config.esxiHosts.filter((h) => h.id !== id)
    )
  }

  const handleCloneHost = (host: ESXiHostConfig) => {
    const clonedHost = cloneHost(host, config.esxiHosts.length + 1)
    updateConfig("esxiHosts", [...config.esxiHosts, clonedHost])
  }

  // Windows Servers
  const addWindowsServer = () => {
    const newServer = createDefaultWindowsServer(config.windowsServers.length + 1)
    updateConfig("windowsServers", [...config.windowsServers, newServer])
  }

  const updateWindowsServer = (id: string, updates: Partial<WindowsServerConfig>) => {
    updateConfig(
      "windowsServers",
      config.windowsServers.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const deleteWindowsServer = (id: string) => {
    updateConfig(
      "windowsServers",
      config.windowsServers.filter((s) => s.id !== id)
    )
  }

  const handleCloneWindowsServer = (server: WindowsServerConfig) => {
    const clonedServer = cloneWindowsServer(server, config.windowsServers.length + 1)
    updateConfig("windowsServers", [...config.windowsServers, clonedServer])
  }

  // Calculos de recursos
  const totalCPU =
    config.esxiHosts.reduce((sum, h) => sum + h.cpu, 0) +
    config.windowsServers.reduce((sum, s) => sum + s.cpu, 0) +
    (config.vcenter.enabled ? 4 : 0)
  const totalRAM =
    config.esxiHosts.reduce((sum, h) => sum + h.ram, 0) +
    config.windowsServers.reduce((sum, s) => sum + s.ram, 0) +
    (config.vcenter.enabled ? 16 : 0)
  const totalStorage =
    config.esxiHosts.reduce((sum, h) => sum + calculateHostStorage(h), 0) +
    (config.truenas.enabled ? config.truenas.storage : 0)

  const handleDeploy = () => {
    setTerminalOpen(true)
  }

  const isValid = config.name.trim() !== "" && config.esxiHosts.length > 0

  return (
    <div className="space-y-6">
      {/* Informacion General */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Entorno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="env-name">Nombre del Entorno *</Label>
              <Input
                id="env-name"
                placeholder="mi-entorno-vsphere"
                value={config.name}
                onChange={(e) => updateConfig("name", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-desc">Descripcion</Label>
            <Textarea
              id="env-desc"
              placeholder="Descripcion del proposito de este entorno..."
              value={config.description}
              onChange={(e) => updateConfig("description", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* vCenter Server */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>vCenter Server</CardTitle>
            </div>
            <Switch
              checked={config.vcenter.enabled}
              onCheckedChange={(checked) =>
                updateConfig("vcenter", { ...config.vcenter, enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {config.vcenter.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Select
                value={config.vcenter.version}
                onValueChange={(value) =>
                  updateConfig("vcenter", { ...config.vcenter, version: value })
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VCENTER_VERSIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configuracion de Red para vCenter */}
            <NetworkConfigPanel
              network={config.vcenter.network}
              onChange={(network) =>
                updateConfig("vcenter", { ...config.vcenter, network })
              }
              componentName="vCenter Server"
            />
          </CardContent>
        )}
      </Card>

      {/* Hosts ESXi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle>Hosts ESXi ({config.esxiHosts.length})</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={addHost}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Host
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.esxiHosts.map((host, index) => (
            <ESXiHostCard
              key={host.id}
              host={host}
              index={index}
              canDelete={config.esxiHosts.length > 1}
              onUpdate={updateHost}
              onDelete={deleteHost}
              onClone={handleCloneHost}
            />
          ))}
        </CardContent>
      </Card>

      {/* TrueNAS Storage */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-orange-500" />
              <CardTitle>TrueNAS Storage</CardTitle>
            </div>
            <Switch
              checked={config.truenas.enabled}
              onCheckedChange={(checked) =>
                updateConfig("truenas", { ...config.truenas, enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {config.truenas.enabled && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Version</Label>
                <Select
                  value={config.truenas.version}
                  onValueChange={(value) =>
                    updateConfig("truenas", { ...config.truenas, version: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUENAS_VERSIONS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.truenas.storage}
                  onChange={(e) =>
                    updateConfig("truenas", {
                      ...config.truenas,
                      storage: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="1000"
                />
              </div>
            </div>

            {/* Protocolos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Protocolos a configurar</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TRUENAS_PROTOCOLS.map((protocol) => {
                  const isChecked = config.truenas.protocols.includes(protocol.value)
                  return (
                    <div
                      key={protocol.value}
                      className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`protocol-${protocol.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateConfig("truenas", {
                              ...config.truenas,
                              protocols: [...config.truenas.protocols, protocol.value],
                            })
                          } else {
                            updateConfig("truenas", {
                              ...config.truenas,
                              protocols: config.truenas.protocols.filter((p) => p !== protocol.value),
                            })
                          }
                        }}
                      />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor={`protocol-${protocol.value}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {protocol.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{protocol.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {config.truenas.protocols.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Seleccionados: {config.truenas.protocols.join(", ")}
                </p>
              )}
            </div>

            {/* Configuracion de Red para TrueNAS */}
            <NetworkConfigPanel
              network={config.truenas.network}
              onChange={(network) =>
                updateConfig("truenas", { ...config.truenas, network })
              }
              componentName="TrueNAS"
            />
          </CardContent>
        )}
      </Card>

      {/* Windows Servers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-blue-500" />
              <CardTitle>Windows Servers ({config.windowsServers.length})</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={addWindowsServer}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Server
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.windowsServers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay Windows Servers configurados. Haz clic en &quot;Agregar Server&quot; para agregar uno.
            </p>
          ) : (
            <div className="space-y-4">
              {config.windowsServers.map((server, index) => (
                <WindowsServerCard
                  key={server.id}
                  server={server}
                  index={index}
                  onUpdate={updateWindowsServer}
                  onDelete={deleteWindowsServer}
                  onClone={handleCloneWindowsServer}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-primary">{config.esxiHosts.length}</p>
              <p className="text-sm text-muted-foreground">Hosts ESXi</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-primary">{totalCPU}</p>
              <p className="text-sm text-muted-foreground">Total vCPUs</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-primary">{totalRAM} GB</p>
              <p className="text-sm text-muted-foreground">Total RAM</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-primary">{totalStorage} GB</p>
              <p className="text-sm text-muted-foreground">Total Storage</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.vcenter.enabled && <Badge variant="secondary">vCenter Server</Badge>}
            {config.truenas.enabled && <Badge variant="secondary">TrueNAS Storage</Badge>}
            {config.windowsServers.length > 0 && (
              <Badge variant="secondary">{config.windowsServers.length} Windows Server(s)</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Boton de Deploy */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleDeploy}
          disabled={!isValid}
          className="min-w-[200px]"
        >
          Desplegar Entorno
        </Button>
      </div>

      <DeploymentTerminal
        open={terminalOpen}
        onOpenChange={setTerminalOpen}
        milestoneId="custom"
        milestoneTitle={`Despliegue Personalizado: ${config.name}`}
        customConfig={config}
      />
    </div>
  )
}
