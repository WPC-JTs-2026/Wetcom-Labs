"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Rocket, Loader2 } from "lucide-react"
import type { Environment } from "@/lib/environments"

interface EnvironmentCardProps {
  environment: Environment
}

const difficultyColors = {
  "Básico": "bg-green-100 text-green-800 border-green-200",
  "Intermedio": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Avanzado": "bg-red-100 text-red-800 border-red-200",
}

export function EnvironmentCard({ environment }: EnvironmentCardProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)

  const handleDeploy = async () => {
    setIsDeploying(true)
    // Simular despliegue - aquí irá la lógica real
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDeploying(false)
    setIsDeployed(true)
  }

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {environment.category}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${difficultyColors[environment.difficulty]}`}
          >
            {environment.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2 text-balance">
          {environment.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {environment.description}
        </p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Incluye:</p>
          <ul className="space-y-1.5">
            {environment.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Duración: {environment.duration}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button
          className="w-full"
          onClick={handleDeploy}
          disabled={isDeploying || isDeployed}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Desplegando...
            </>
          ) : isDeployed ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Entorno Listo
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Desplegar Entorno
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
