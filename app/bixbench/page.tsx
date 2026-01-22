"use client"

import Link from "next/link"
import { FlaskConical, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { PerformanceCards, ConsistencyCard } from "@/components/bixbench/performance-cards"
import { OpenAnswerChart, FailureModesChart } from "@/components/bixbench/analysis-charts"
import { DataSourcePanel, AnalysisSidebar } from "@/components/bixbench/data-source-panel"
import { DatasetBreakdownTable, DatasetBreakdownTableAlt } from "@/components/bixbench/dataset-tables"
import { SkillBreakdownChart } from "@/components/bixbench/skill-breakdown"

export default function BixBenchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      {/* Secondary Navigation */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
              <span className="text-xl font-semibold text-primary-foreground">BixBench</span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6 text-sm">
                <Link href="#" className="text-primary-foreground/70 hover:text-primary-foreground">Overview</Link>
                <Link href="#" className="text-primary-foreground/70 hover:text-primary-foreground">Tasks</Link>
                <Link href="#" className="text-primary-foreground/70 hover:text-primary-foreground">Leaderboards</Link>
              </nav>
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-sm">
                API Docs
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Evaluation Metrics for Bioinformatics Agent Skills on BixBench
          </h1>
          <p className="text-primary-foreground/70 max-w-4xl">
            Analysis and validation of deterministic bioinformatics agent skills applied to the challenges in BixBench, evaluating both open-answer and multiple-choice question performance.{" "}
            <Link href="#" className="text-primary-foreground hover:underline">Learn more</Link>
            <span className="text-primary-foreground/50 ml-2">#conned-Bixbenchouto: BixBenchowr</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-2 space-y-4">
            <AnalysisSidebar />
            <DataSourcePanel />
          </div>

          {/* Main Content Area */}
          <div className="col-span-7 space-y-6">
            <PerformanceCards />
            
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <OpenAnswerChart />
              </div>
              <div className="col-span-2">
                <FailureModesChart />
              </div>
            </div>

            <SkillBreakdownChart />

            <div className="grid grid-cols-2 gap-4">
              <DatasetBreakdownTable title="Dataset Breakdown by Data Type" />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-4">
            <ConsistencyCard />
            <DatasetBreakdownTable />
            <DatasetBreakdownTableAlt />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-primary-foreground/60">
          <p>&copy; 2024 BixBench Evaluation Platform</p>
        </div>
      </footer>
    </div>
  )
}
