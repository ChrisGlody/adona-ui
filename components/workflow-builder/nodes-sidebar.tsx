"use client"

import { useState } from "react"
import { Search, ChevronRight, Dna, FlaskConical, Zap, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"

const foundationModels = [
  { id: "dna-bert", name: "DNA-BERT V2.0", icon: Dna, color: "bg-emerald-500" },
  { id: "boltzfold", name: "BoltzFold", icon: FlaskConical, color: "bg-primary" },
]

const skills = [
  { id: "gene-variant", name: "GeneVariant-Annotator", version: "3" },
  { id: "protein-struct", name: "ProteinStruct-Predictor", version: "3" },
]

const functionCalls = [
  { id: "get-weather", name: "GetWeatherInfo", icon: Zap, color: "bg-primary" },
  { id: "email-sender", name: "EmailSender", icon: Mail, color: "bg-amber-500" },
]

export function NodesSidebar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="w-64 bg-white border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-3">Workflow Nodes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Foundation Models */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Foundation Models</h3>
          <div className="space-y-2">
            {foundationModels.map((model) => {
              const Icon = model.icon
              return (
                <div
                  key={model.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:bg-muted/50 cursor-grab transition-colors"
                  draggable
                >
                  <div className={`w-8 h-8 ${model.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{model.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Skills</h3>
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-white hover:bg-muted/50 cursor-grab transition-colors"
                draggable
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{skill.name}</span>
                </div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  {skill.version}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Function Calls */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Function Calls</h3>
          <div className="space-y-2">
            {functionCalls.map((func) => {
              const Icon = func.icon
              return (
                <div
                  key={func.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:bg-muted/50 cursor-grab transition-colors"
                  draggable
                >
                  <div className={`w-8 h-8 ${func.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{func.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-1">
          <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-foreground">Connections</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-foreground">Validation</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
