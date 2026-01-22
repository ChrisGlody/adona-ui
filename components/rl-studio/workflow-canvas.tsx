"use client"

import { Card } from "@/components/ui/card"

interface WorkflowNodeProps {
  title: string
  subtitle?: string
  icon: string
  color: string
  position: { x: number; y: number }
  hasIndicator?: boolean
  indicatorColor?: string
}

function WorkflowNode({ title, subtitle, icon, color, position, hasIndicator, indicatorColor }: WorkflowNodeProps) {
  return (
    <div 
      className="absolute"
      style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <Card className={`px-4 py-3 ${color} shadow-md border-0 relative`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="text-sm font-medium text-white">{title}</div>
            {subtitle && <div className="text-xs text-white/80">{subtitle}</div>}
          </div>
        </div>
        {hasIndicator && (
          <div className={`absolute -right-1 -top-1 w-3 h-3 rounded-full ${indicatorColor} border-2 border-white`} />
        )}
      </Card>
    </div>
  )
}

export function WorkflowCanvas() {
  return (
    <div className="flex-1 bg-slate-50 relative overflow-hidden">
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        
        {/* OpenEnv to Skills Gateway */}
        <path d="M 250 140 L 250 200 L 400 250" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* OpenEnv to Ranking Policy */}
        <path d="M 320 120 L 520 120" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Ranking Policy to Skills Gateway */}
        <path d="M 580 160 L 580 220 L 470 250" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Skills Gateway to Generate Candidates */}
        <path d="M 380 290 L 280 350" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Generate Candidates to Score Peptides */}
        <path d="M 320 370 L 420 370" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Score Peptides to Rerank List */}
        <path d="M 540 370 L 640 370" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Rerank List to Evaluation Metrics */}
        <path d="M 700 400 L 700 440 L 600 470" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Evaluation Metrics back to Skills */}
        <path d="M 540 490 Q 440 520 440 400 L 440 310" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
      </svg>

      {/* Workflow Nodes */}
      <div className="relative w-full h-full" style={{ zIndex: 1 }}>
        <WorkflowNode
          title="OpenEnv"
          subtitle="Environment"
          icon="🌐"
          color="bg-blue-500"
          position={{ x: 28, y: 22 }}
        />
        
        <WorkflowNode
          title="Ranking Policy"
          subtitle="(LoRA)"
          icon="🎯"
          color="bg-amber-600"
          position={{ x: 72, y: 22 }}
          hasIndicator
          indicatorColor="bg-green-500"
        />
        
        <WorkflowNode
          title="Skills Gateway"
          icon="⚙️"
          color="bg-slate-600"
          position={{ x: 50, y: 45 }}
        />
        
        <WorkflowNode
          title="Generate Candidates"
          icon="🔄"
          color="bg-teal-500"
          position={{ x: 28, y: 68 }}
          hasIndicator
          indicatorColor="bg-green-500"
        />
        
        <WorkflowNode
          title="Score Peptides"
          icon="📊"
          color="bg-teal-500"
          position={{ x: 50, y: 68 }}
          hasIndicator
          indicatorColor="bg-green-500"
        />
        
        <WorkflowNode
          title="Rerank List"
          icon="✓"
          color="bg-teal-500"
          position={{ x: 72, y: 68 }}
          hasIndicator
          indicatorColor="bg-green-500"
        />
        
        <WorkflowNode
          title="Evaluation Metrics"
          icon="📈"
          color="bg-slate-400"
          position={{ x: 62, y: 88 }}
          hasIndicator
          indicatorColor="bg-slate-300"
        />
      </div>
    </div>
  )
}
