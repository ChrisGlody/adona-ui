"use client"

import { Card, CardContent } from "@/components/ui/card"

const lineData = [
  { x: 0, bioAgent: 12, gpt4: 8, claude: 10, recom: 5, random: 3 },
  { x: 1, bioAgent: 28, gpt4: 22, claude: 25, recom: 15, random: 5 },
  { x: 2, bioAgent: 35, gpt4: 30, claude: 32, recom: 20, random: 6 },
  { x: 3, bioAgent: 38, gpt4: 32, claude: 34, recom: 22, random: 7 },
  { x: 4, bioAgent: 40, gpt4: 34, claude: 36, recom: 24, random: 8 },
  { x: 5, bioAgent: 42, gpt4: 35, claude: 37, recom: 25, random: 8 },
]

const models = [
  { name: "BioAgent v1.0", color: "#3b82f6", key: "bioAgent" },
  { name: "GPT-4o", color: "#10b981", key: "gpt4" },
  { name: "Claude 3.5 Sonnet", color: "#f59e0b", key: "claude" },
  { name: "Recom", color: "#ec4899", key: "recom" },
  { name: "Random Guess", color: "#94a3b8", key: "random" },
]

export function SkillBreakdownChart() {
  const maxY = 45
  const width = 100
  const height = 60

  const getPath = (key: string) => {
    const points = lineData.map((d, i) => {
      const x = (i / (lineData.length - 1)) * width
      const y = height - (d[key as keyof typeof d] as number / maxY) * height
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    return points
  }

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800">Top-Skill Breakdown</h3>
            <span className="text-sm text-slate-500">|</span>
            <span className="text-sm text-slate-600">BixBench & Phillimps, MCQ Refusale Off</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800">87%</span>
            <select className="text-xs border border-slate-200 rounded px-2 py-1 bg-white">
              <option>5T</option>
            </select>
          </div>
        </div>

        {/* Line Chart */}
        <div className="relative h-40 mb-4">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400 pr-2">
            <span>42%</span>
            <span>12%</span>
            <span>0%</span>
          </div>
          <div className="ml-8 h-full border-l border-b border-slate-200 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
              {models.map((model) => (
                <path
                  key={model.key}
                  d={getPath(model.key)}
                  fill="none"
                  stroke={model.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {models.map((model) => (
                lineData.map((d, i) => (
                  <circle
                    key={`${model.key}-${i}`}
                    cx={(i / (lineData.length - 1)) * width}
                    cy={height - ((d[model.key as keyof typeof d] as number) / maxY) * height}
                    r="3"
                    fill={model.color}
                    vectorEffect="non-scaling-stroke"
                  />
                ))
              ))}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          {models.map((model) => (
            <div key={model.key} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: model.color }}
              />
              <span className="text-slate-600">{model.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
