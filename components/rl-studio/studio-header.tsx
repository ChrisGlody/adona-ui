"use client"

import { ChevronDown, MoreVertical, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function StudioHeader() {
  return (
    <header className="bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">RL Studio</span>
        </div>
        
        <div className="flex items-center gap-2 text-primary-foreground/70">
          <Home className="h-4 w-4" />
          <span className="text-sm">Tenant A</span>
          <ChevronDown className="h-4 w-4" />
          <span className="text-sm">Cancer Workspace</span>
          <ChevronDown className="h-4 w-4" />
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Badge className="bg-teal-600 hover:bg-teal-600 text-white text-xs">Deterministic</Badge>
          <Badge className="bg-teal-600 hover:bg-teal-600 text-white text-xs">Budget OK</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-primary border-primary-foreground/30 bg-primary-foreground hover:bg-primary-foreground/90">
          Generate
        </Button>
        <Button size="sm" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border border-primary-foreground/30">
          Run Test
        </Button>
        <Button variant="outline" size="sm" className="text-primary border-primary-foreground/30 bg-primary-foreground hover:bg-primary-foreground/90">
          Evaluate
        </Button>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          Publish
        </Button>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
