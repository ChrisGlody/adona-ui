"use client"

import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { FilterBar } from "@/components/workflow-runs/filter-bar"
import { RunsTable } from "@/components/workflow-runs/runs-table"
import { ExecutionSummary } from "@/components/workflow-runs/execution-summary"
import { RunDetailPanel } from "@/components/workflow-runs/run-detail-panel"
import { ChevronDown, Twitter, Linkedin } from "lucide-react"

export default function WorkflowRunsPage() {
  const [activeTab, setActiveTab] = useState("workflow-runs")

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Workflow Runs</h1>
          <p className="text-primary-foreground/70 max-w-2xl">
            Review detailed execution data for your <strong className="text-primary-foreground">AI-powered</strong> workflows. Track inputs, outputs, determinism, logs, and artifacts per run.{" "}
            <span className="inline-flex items-center gap-1 text-primary-foreground/60">
              And importantils: <ChevronDown className="h-4 w-4" />
            </span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 -mt-2 mb-6">
        <div className="flex gap-2">
          {["Workflow Runs", "Protein Structure Predictor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, "-"))}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.toLowerCase().replace(/ /g, "-")
                  ? "bg-white shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pb-8">
        <FilterBar />

        <div className="grid lg:grid-cols-[1fr_280px] gap-6 mb-6">
          <RunsTable />
          <ExecutionSummary />
        </div>

        <RunDetailPanel />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Twitter className="h-4 w-4 text-primary-foreground/60 hover:text-primary-foreground cursor-pointer" />
              <Linkedin className="h-4 w-4 text-primary-foreground/60 hover:text-primary-foreground cursor-pointer" />
            </div>
            <nav className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/60">
              <a href="#" className="hover:text-primary-foreground">Product</a>
              <a href="#" className="hover:text-primary-foreground">Functions</a>
              <a href="#" className="hover:text-primary-foreground">Models</a>
              <a href="#" className="hover:text-primary-foreground">Evaluations</a>
              <a href="#" className="hover:text-primary-foreground">Docs</a>
              <span className="h-4 w-px bg-primary-foreground/30" />
              <a href="#" className="hover:text-primary-foreground">Status</a>
              <a href="#" className="hover:text-primary-foreground">Docs</a>
              <a href="#" className="hover:text-primary-foreground">Support</a>
              <a href="#" className="hover:text-primary-foreground">Privacy</a>
            </nav>
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-primary-foreground/60" />
              <Linkedin className="h-4 w-4 text-primary-foreground/60" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
