"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { MilestoneItem } from "./milestone-item"
import type { Phase } from "@/lib/environments"

interface PhaseAccordionProps {
  phase: Phase
  defaultOpen?: boolean
}

export function PhaseAccordion({ phase, defaultOpen = false }: PhaseAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      {/* Phase Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            {phase.number}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {phase.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {phase.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {phase.milestones.length} milestones
          </span>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Milestones List */}
      {isOpen && (
        <div className="border-t bg-muted/20">
          <div className="p-4 space-y-3">
            {phase.milestones.map((milestone) => (
              <MilestoneItem 
                key={milestone.id} 
                milestone={milestone}
                phaseNumber={phase.number}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
