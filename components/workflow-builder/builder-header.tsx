"use client"

import { Grid3X3, Bell, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BuilderHeader() {
  return (
    <header className="h-12 bg-gradient-to-r from-primary/90 to-accent/90 flex items-center justify-between px-4 border-b border-primary-foreground/10">
      {/* Left - Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary-foreground/20 rounded flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">W</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-primary-foreground/70">Workflows</span>
          <span className="text-primary-foreground/50 mx-2">/</span>
          <span className="text-primary-foreground bg-primary-foreground/20 px-2 py-0.5 rounded">New Workflow</span>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <Grid3X3 className="h-5 w-5" />
        </button>
        <button className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
            2
          </span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden border-2 border-primary-foreground/30">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
    </header>
  )
}

export function BuilderSubheader() {
  return (
    <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workflow Builder</h1>
        <p className="text-muted-foreground mt-1">
          Visually build and manage complex AI-powered workflows.
        </p>
      </div>
      <Button className="bg-primary hover:bg-primary/90">
        <Plus className="h-4 w-4 mr-2" />
        New Workflow
      </Button>
    </div>
  )
}
