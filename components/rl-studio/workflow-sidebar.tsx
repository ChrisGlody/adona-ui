"use client"

import { ChevronRight, FileCode, Settings, Plus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const artifacts = [
  { name: "Peptide Reward Function", version: "v1.2", status: "Draft", icon: FileCode, color: "bg-blue-500" },
  { name: "Ranking Policy (LoRA)", version: "v3.5", status: "Draft", icon: Settings, color: "bg-amber-500" },
  { name: "OpenEnv Spec", version: "v1.0", status: "Draft", icon: Plus, color: "bg-blue-500" },
  { name: "Evaluation Suite", version: "v2.1", status: "Validated", icon: CheckCircle, color: "bg-green-500" },
]

export function WorkflowSidebar() {
  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 flex-1">
        <h2 className="font-semibold text-foreground mb-3">Describe Your Workflow</h2>
        <Card className="p-3 bg-muted/50 border-border mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            I want to rank peptide candidates.
            <br />
            Reward = nDCG@10 vs. oracle ranking - toxicity penalty.
            <br />
            <span className="italic">Actions: generate candidates, score peptides, rerank list.</span>
          </p>
        </Card>
        
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-6">
          Generate Configuration
        </Button>

        <h3 className="font-semibold text-foreground mb-3">Generated Artifacts</h3>
        <div className="space-y-2">
          {artifacts.map((artifact, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${artifact.color}`}>
                  <artifact.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{artifact.name}</span>
                    <span className="text-xs text-muted-foreground">{artifact.version}</span>
                    <Badge 
                      variant={artifact.status === "Validated" ? "default" : "secondary"}
                      className={`text-[10px] px-1.5 py-0 ${
                        artifact.status === "Validated" 
                          ? "bg-green-500 hover:bg-green-500 text-white" 
                          : "bg-amber-500 hover:bg-amber-500 text-white"
                      }`}
                    >
                      {artifact.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
