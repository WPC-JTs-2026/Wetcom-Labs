"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Square, CheckCircle, AlertCircle, Terminal, HelpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DeploymentTerminalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestoneId: string
  milestoneTitle: string
  customConfig?: any
}

export function DeploymentTerminal({
  open,
  onOpenChange,
  milestoneId,
  milestoneTitle,
  customConfig,
}: DeploymentTerminalProps) {
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed" | "canceled">("idle")
  const [stage, setStage] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)
  const terminalContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (open) {
      // Clear logs from backend first, then trigger deploy
      startDeploy()
      
      // Start polling
      interval = setInterval(fetchStatus, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, milestoneId])

  useEffect(() => {
    const container = terminalContainerRef.current
    if (container) {
      // Auto-scroll only if user is close to the bottom (within 150px)
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [logs])

  const startDeploy = async () => {
    try {
      setStatus("running")
      setLogs(["[SYSTEM] Iniciando proceso de despliegue...", "[SYSTEM] Preparando variables de Terraform..."])
      
      // Clear old logs in the manager
      await fetch("/api/deploy/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      })

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, customConfig }),
      })


      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al iniciar el despliegue")
      }
    } catch (error: any) {
      console.error(error)
      setStatus("failed")
      setLogs((prev) => [...prev, `[ERROR] ${error.message}`])
      toast.error(`Error de despliegue: ${error.message}`)
    }
  }

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/deploy/status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
        setStage(data.stage)
        setCurrentStep(data.currentStep)
        setTotalSteps(data.totalSteps)
        setProgress(data.progress)
        
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs)
        }
      }
    } catch (error) {
      console.error("Error fetching status:", error)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const res = await fetch("/api/deploy", { method: "DELETE" })
      if (res.ok) {
        toast.info("Despliegue cancelado")
      } else {
        toast.error("Error al intentar cancelar")
      }
    } catch (e) {
      toast.error("Error al conectar con el servidor")
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "text-blue-500"
      case "completed":
        return "text-green-500"
      case "failed":
        return "text-red-500"
      case "canceled":
        return "text-orange-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "canceled":
        return <Square className="h-5 w-5 text-orange-500" />
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6 gap-4 bg-background">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold">Consola de Despliegue</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{milestoneTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-semibold">
              {getStatusIcon()}
              <span className={getStatusColor()}>{status.toUpperCase()}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Info panel of the active step */}
        {status === "running" && stage && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm">
            <p className="font-semibold">Paso {currentStep} de {totalSteps}:</p>
            <p className="text-xs text-blue-300 mt-1">{stage}</p>
          </div>
        )}

        {/* Terminal Log Area */}
        <div 
          ref={terminalContainerRef}
          className="flex-1 min-h-0 bg-zinc-950 text-zinc-100 p-4 rounded-lg font-mono text-xs overflow-y-auto border border-zinc-800 shadow-inner flex flex-col gap-1"
        >
          {logs.map((log, index) => {
            let colorClass = "text-zinc-300"
            if (log.includes("[ERROR]") || log.includes("[STDERR]")) {
              colorClass = "text-red-400 font-bold"
            } else if (log.includes("[SYSTEM]")) {
              colorClass = "text-blue-400 font-semibold"
            } else if (log.includes("apply") || log.includes("init") || log.startsWith(">")) {
              colorClass = "text-yellow-400"
            } else if (log.includes("Apply complete!") || log.includes("success")) {
              colorClass = "text-green-400 font-bold"
            } else if (log.includes("Plan:")) {
              colorClass = "text-cyan-400"
            }

            return (
              <div key={index} className={`${colorClass} whitespace-pre-wrap leading-relaxed`}>
                {log}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso Total</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Control Buttons */}
        <DialogFooter className="flex-shrink-0 flex items-center justify-between gap-4 mt-2">
          <div className="text-xs text-muted-foreground">
            {status === "running" ? "Ejecutando scripts de Terraform locales..." : "Proceso finalizado"}
          </div>
          <div className="flex gap-2">
            {status === "running" && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
                className="gap-2"
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Cancelar
              </Button>
            )}
            <Button
              variant={status === "completed" ? "default" : "outline"}
              onClick={() => onOpenChange(false)}
              disabled={status === "running"}
            >
              Cerrar Consola
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
