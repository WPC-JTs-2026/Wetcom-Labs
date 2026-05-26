"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { PhaseAccordion } from "@/components/phase-accordion"
import { phases } from "@/lib/environments"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar fases y milestones basado en el termino de busqueda
  const filteredPhases = phases.map((phase) => ({
    ...phase,
    milestones: phase.milestones.filter(
      (milestone) =>
        milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        milestone.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        milestone.components.some((c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ),
  })).filter((phase) => phase.milestones.length > 0)

  const totalMilestones = phases.reduce((acc, phase) => acc + phase.milestones.length, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3 text-balance">
            Laboratorios vSphere
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Selecciona un Milestone y despliega el entorno preconfigurado en segundos. 
            Cada laboratorio incluye todos los componentes necesarios para comenzar a practicar.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>{phases.length} Fases</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{totalMilestones} Milestones</span>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar milestones, componentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Phases List */}
        {filteredPhases.length > 0 ? (
          <div className="space-y-4">
            {filteredPhases.map((phase, index) => (
              <PhaseAccordion 
                key={phase.id} 
                phase={phase}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron milestones que coincidan con tu busqueda.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Wetcom. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
