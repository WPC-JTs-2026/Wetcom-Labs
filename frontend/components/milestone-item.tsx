"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  Rocket, 
  Loader2, 
  Server, 
  HardDrive,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { Milestone } from "@/lib/environments"

interface MilestoneItemProps {
  milestone: Milestone
  phaseNumber: number
}

export function MilestoneItem({ milestone, phaseNumber }: MilestoneItemProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDeploy = async () => {
    setIsDeploying(true)
    // Simular despliegue - aqui ira la logica real
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setIsDeploying(false)
    setIsDeployed(true)
  }

  return (
    <div className="border rounded-lg bg-card transition-all hover:border-primary/40">
      <div 
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Milestone Number */}
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {phaseNumber}.{milestone.number}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {milestone.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {milestone.description}
              </p>
            </div>
            
            {/* Expand/Collapse */}
            <button 
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Quick Component Preview */}
          <div className="flex flex-wrap gap-2 mt-3">
            {milestone.components.slice(0, 3).map((component, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                {component.quantity}x {component.name}
                {component.version && ` ${component.version}`}
              </Badge>
            ))}
            {milestone.components.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{milestone.components.length - 3} mas
              </Badge>
            )}
          </div>
        </div>

        {/* Deploy Button */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying || isDeployed}
            className="min-w-[140px]"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Desplegando...
              </>
            ) : isDeployed ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Listo
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Desplegar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-14 pt-3 border-t">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Componentes del entorno:
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {milestone.components.map((component, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {component.name.includes("ESXi") || component.name.includes("vCenter") ? (
                      <Server className="h-4 w-4 text-primary" />
                    ) : (
                      <HardDrive className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {component.quantity}x {component.name}
                      {component.version && (
                        <span className="text-muted-foreground font-normal ml-1">
                          v{component.version}
                        </span>
                      )}
                    </p>
                    {component.details && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {component.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
