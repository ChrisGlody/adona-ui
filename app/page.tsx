"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { LogsExplorer } from "@/components/logs-explorer"
import { IncidentsPanel } from "@/components/incidents-panel"
import { MetricsDashboard } from "@/components/metrics-dashboard"
import { ActionBar } from "@/components/action-bar"
import { MainNav } from "@/components/main-nav"

export default function ObservabilityDashboard() {
  const [activeTab, setActiveTab] = useState("logs")

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <ActionBar />
        
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-6">
          <LogsExplorer />
          <IncidentsPanel />
        </div>

        <MetricsDashboard />
      </main>

      <DashboardFooter />
    </div>
  )
}
