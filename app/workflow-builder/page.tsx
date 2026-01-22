"use client"

import { BuilderSidebar } from "@/components/workflow-builder/builder-sidebar"
import { BuilderHeader, BuilderSubheader } from "@/components/workflow-builder/builder-header"
import { NodesSidebar } from "@/components/workflow-builder/nodes-sidebar"
import { BuilderCanvas } from "@/components/workflow-builder/builder-canvas"
import { SettingsPanel } from "@/components/workflow-builder/settings-panel"
import { MainNav } from "@/components/main-nav"

export default function WorkflowBuilderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      
      <div className="flex-1 flex">
        {/* Left Icon Sidebar */}
        <BuilderSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <BuilderHeader />
          <BuilderSubheader />

          {/* Main Builder Area */}
          <div className="flex-1 flex">
            {/* Nodes Panel */}
            <NodesSidebar />

            {/* Canvas */}
            <BuilderCanvas />

            {/* Settings Panel */}
            <SettingsPanel />
          </div>

          {/* Footer */}
          <footer className="bg-gradient-to-r from-primary/80 to-accent/80 py-3 px-6">
            <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60">
              <span>© YourCompany</span>
              <span>•</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">Status</a>
              <span>•</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">Docs</a>
              <span>•</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">Support</a>
              <span>•</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">Privacy</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
