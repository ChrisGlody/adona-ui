"use client"

import { useState } from "react"
import { StudioHeader } from "@/components/rl-studio/studio-header"
import { WorkflowSidebar } from "@/components/rl-studio/workflow-sidebar"
import { WorkflowCanvas } from "@/components/rl-studio/workflow-canvas"
import { RewardPanel } from "@/components/rl-studio/reward-panel"
import { RunTracePanel } from "@/components/rl-studio/run-trace-panel"
import { MainNav } from "@/components/main-nav"

export default function RLStudioPage() {
  const [showRewardPanel, setShowRewardPanel] = useState(true)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <StudioHeader />
      
      
      <div className="flex-1 flex">
        <WorkflowSidebar />
        
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 relative">
            <WorkflowCanvas />
            
            {/* Reward Panel Overlay */}
            {showRewardPanel && (
              <div className="absolute top-4 right-4 z-10">
                <RewardPanel onClose={() => setShowRewardPanel(false)} />
              </div>
            )}
          </div>
          
          <RunTracePanel />
        </div>
      </div>
    </div>
  )
}
