"use client"

import { Bell, Grid3x3, FileText, LayoutList, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "logs", label: "Logs Explorer" },
  { id: "metrics", label: "Metrics Dashboard" },
  { id: "index", label: "Index / Vector Stores" },
]

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary-foreground/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <span className="ml-2 font-semibold text-primary-foreground/80">N</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <Grid3x3 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">2</span>
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-medium">👤</span>
          </div>
        </div>
      </div>

      <div className="text-center py-8">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Observability & Reliability</h1>
        <p className="mt-2 text-primary-foreground/80">
          Monitor runs, analyze metrics, and manage <span className="font-semibold text-primary-foreground">incidents</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-1 pb-4">
        <nav className="flex items-center bg-primary-foreground/10 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ml-4 flex items-center gap-1">
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <LayoutList className="h-4 w-4" />
            Logs Explore
          </Button>
          <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:bg-primary-foreground/10">
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:bg-primary-foreground/10">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
