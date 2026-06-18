"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    vsphere_server: "",
    vsphere_user: "",
    vsphere_password: "",
    datacenter_name: "",
    cluster_name: "",
    datastore_name: "",
    network_name: "",
    resource_pool_name: "",
    vm_folder_path: "",
    vm_domain: "",
    esxi_deploy_host: "",
    truenas_template_name: "",
  })

  useEffect(() => {
    if (open) {
      fetchSettings()
    }
  }, [open])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setConfig((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        toast.success("Configuración guardada correctamente")
        setOpen(false)
      } else {
        toast.error("Error al guardar la configuración")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Ajustes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuración del Entorno (Playground)
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Sección 1: Credenciales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
                1. Credenciales vCenter de Origen (VCF / Playground)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vsphere_server">Host / IP del vCenter</Label>
                  <Input
                    id="vsphere_server"
                    placeholder="vcenter-001.playground.net"
                    value={config.vsphere_server}
                    onChange={(e) => handleChange("vsphere_server", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vsphere_user">Usuario de Conexión</Label>
                  <Input
                    id="vsphere_user"
                    placeholder="administrator@vsphere.local"
                    value={config.vsphere_user}
                    onChange={(e) => handleChange("vsphere_user", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vsphere_password">Contraseña</Label>
                  <Input
                    id="vsphere_password"
                    type="password"
                    placeholder="••••••••"
                    value={config.vsphere_password}
                    onChange={(e) => handleChange("vsphere_password", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Estructura */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
                2. Estructura de vCenter Padre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="datacenter_name">Nombre de Datacenter</Label>
                  <Input
                    id="datacenter_name"
                    placeholder="Playground"
                    value={config.datacenter_name}
                    onChange={(e) => handleChange("datacenter_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cluster_name">Nombre del Clúster</Label>
                  <Input
                    id="cluster_name"
                    placeholder="Cluster-001"
                    value={config.cluster_name}
                    onChange={(e) => handleChange("cluster_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datastore_name">Datastore Destino</Label>
                  <Input
                    id="datastore_name"
                    placeholder="vSanDatastore"
                    value={config.datastore_name}
                    onChange={(e) => handleChange("datastore_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network_name">Segmento de Red / PortGroup</Label>
                  <Input
                    id="network_name"
                    placeholder="VM Network"
                    value={config.network_name}
                    onChange={(e) => handleChange("network_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource_pool_name">Resource Pool asignado</Label>
                  <Input
                    id="resource_pool_name"
                    placeholder="WPC"
                    value={config.resource_pool_name}
                    onChange={(e) => handleChange("resource_pool_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm_folder_path">Ruta de Folder para VMs</Label>
                  <Input
                    id="vm_folder_path"
                    placeholder="WPC/Mi Nombre"
                    value={config.vm_folder_path}
                    onChange={(e) => handleChange("vm_folder_path", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Opciones de Plantillas y ESXi */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
                3. ESXi Físico y Plantillas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="esxi_deploy_host">Host Físico de Despliegue (IP/FQDN)</Label>
                  <Input
                    id="esxi_deploy_host"
                    placeholder="esxi-04.playground.net"
                    value={config.esxi_deploy_host}
                    onChange={(e) => handleChange("esxi_deploy_host", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm_domain">Dominio DNS para VMs</Label>
                  <Input
                    id="vm_domain"
                    placeholder=".mi-nombre.playground.net"
                    value={config.vm_domain}
                    onChange={(e) => handleChange("vm_domain", e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="truenas_template_name">Nombre de Plantilla de TrueNAS</Label>
                  <Input
                    id="truenas_template_name"
                    placeholder="truenas-template.playground.net"
                    value={config.truenas_template_name}
                    onChange={(e) => handleChange("truenas_template_name", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Ajustes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
