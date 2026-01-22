"use client"

import { Download, MessageSquare, Settings, Maximize2 } from "lucide-react"

const workflowNodes = [
  {
    id: "boltzfold",
    name: "BoltzFold",
    type: "model",
    color: "bg-primary",
    position: { x: 50, y: 0 },
  },
  {
    id: "protein-struct",
    name: "ProteinStruct",
    subtitle: "Predictor Skill",
    type: "skill",
    color: "bg-violet-600",
    badge: "Deterministic",
    badgeColor: "bg-white text-violet-600",
    position: { x: 50, y: 140 },
  },
  {
    id: "get-weather",
    name: "GetWeatherInfo",
    subtitle: "Function",
    type: "function",
    color: "bg-amber-500",
    badge: "Authenticated",
    badgeColor: "bg-white text-amber-600",
    position: { x: 50, y: 280 },
  },
  {
    id: "rag-db",
    name: "RAG DB:",
    subtitle: "Research Papers DB",
    type: "database",
    color: "bg-orange-500",
    badge: "Global",
    badgeColor: "bg-white text-orange-600",
    position: { x: 50, y: 420 },
  },
]

export function BuilderCanvas() {
  return (
    <div className="flex-1 bg-slate-50 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <button className="p-2 bg-white rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <Download className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-2 bg-white rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Grid Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Canvas Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="relative" style={{ width: "200px", height: "520px" }}>
          {/* Connection Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
          >
            {/* Line from BoltzFold to ProteinStruct */}
            <line
              x1="100"
              y1="60"
              x2="100"
              y2="140"
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {/* Line from ProteinStruct to GetWeatherInfo */}
            <line
              x1="100"
              y1="220"
              x2="100"
              y2="280"
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {/* Line from GetWeatherInfo to RAG DB */}
            <line
              x1="100"
              y1="360"
              x2="100"
              y2="420"
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>

          {/* Workflow Nodes */}
          {workflowNodes.map((node) => (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: `${node.position.x}%`,
                top: node.position.y,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className={`${node.color} rounded-xl p-4 min-w-[160px] shadow-lg cursor-move relative group`}
              >
                {/* Node Actions */}
                <div className="absolute -right-1 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
                    <Settings className="h-3 w-3 text-white" />
                  </button>
                  <button className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
                    <Maximize2 className="h-3 w-3 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {node.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{node.name}</p>
                    {node.subtitle && (
                      <p className="text-white/80 text-xs">{node.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge */}
              {node.badge && (
                <div className="flex justify-center mt-2">
                  <span
                    className={`${node.badgeColor} px-3 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1`}
                  >
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    {node.badge}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
