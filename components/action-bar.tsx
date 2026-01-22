"use client"

import { FileOutput, BarChart3, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ActionBar() {
  return (
    <div className="flex items-center justify-end gap-3 mb-4">
      <Button variant="outline" className="gap-2 border-border/50 bg-card">
        <FileOutput className="h-4 w-4" />
        Export to SIEM
      </Button>
      <Button variant="outline" className="gap-2 border-border/50 bg-card">
        <BarChart3 className="h-4 w-4" />
        View Full Metrics
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
