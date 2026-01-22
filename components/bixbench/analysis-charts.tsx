"use client"

import { Card, CardContent } from "@/components/ui/card"

const barData = [
  { label: "Data\nCleansing", accuracy: 72, confidence: 65, skillUsage: 45 },
  { label: "Differential\nExpression", accuracy: 78, confidence: 70, skillUsage: 55 },
  { label: "Pathway\nAnalysis", accuracy: 65, confidence: 58, skillUsage: 48 },
  { label: "Variant\nAnalysis", accuracy: 82, confidence: 75, skillUsage: 62 },
  { label: "Variant\nAnnotation", accuracy: 70, confidence: 62, skillUsage: 50 },
]

export function OpenAnswerChart() {
  const maxValue = 100

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Open-Answer Analysis</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span className="text-slate-600">Accuracy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-300 rounded-sm" />
              <span className="text-slate-600">Confidence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-slate-300 rounded-sm" />
              <span className="text-slate-600">Skill Usage</span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {barData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex items-end gap-0.5 h-40 w-full justify-center">
                <div
                  className="w-4 bg-blue-500 rounded-t transition-all"
                  style={{ height: `${(item.accuracy / maxValue) * 100}%` }}
                />
                <div
                  className="w-4 bg-blue-300 rounded-t transition-all"
                  style={{ height: `${(item.confidence / maxValue) * 100}%` }}
                />
                <div
                  className="w-4 bg-slate-300 rounded-t transition-all"
                  style={{ height: `${(item.skillUsage / maxValue) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-center mt-2 whitespace-pre-line leading-tight">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
          <span className="text-amber-500">*</span>
          Seek for ad-sdemity-agent-impiting-agent-data-auta analyds
        </p>
      </CardContent>
    </Card>
  )
}

const pieData = [
  { label: "Stat Test Selection", percentage: 32, color: "bg-blue-500" },
  { label: "Plot Misinterpretation", percentage: 25, color: "bg-amber-400" },
  { label: "Data Cleanup Error", percentage: 20, color: "bg-blue-300" },
]

export function FailureModesChart() {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Leading Failure Modes</h3>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="20"
                strokeDasharray={`${32 * 2.51} ${100 * 2.51}`}
                strokeDashoffset="0"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="20"
                strokeDasharray={`${25 * 2.51} ${100 * 2.51}`}
                strokeDashoffset={`${-32 * 2.51}`}
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="20"
                strokeDasharray={`${20 * 2.51} ${100 * 2.51}`}
                strokeDashoffset={`${-57 * 2.51}`}
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="20"
                strokeDasharray={`${23 * 2.51} ${100 * 2.51}`}
                strokeDashoffset={`${-77 * 2.51}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="grid grid-cols-2 gap-1 text-xs font-semibold">
                  <span className="text-blue-500">23%</span>
                  <span className="text-amber-400">25%</span>
                  <span className="text-blue-300">20%</span>
                  <span className="text-slate-400">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-sm ${item.color}`} />
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-800 ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
