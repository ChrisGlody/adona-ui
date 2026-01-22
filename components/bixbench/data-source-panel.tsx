"use client"

import { Check, Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DataSourcePanel() {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">Data Source</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Database className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">BioAgent v1.0</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Database className="h-3 w-3" />
              BixBench
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-600">BixBench Dataset v1</span>
          </div>
          <div className="text-xs text-slate-500 ml-6">Snapshot: April 2024</div>
          
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-slate-500">Version Control: None</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-slate-500">Pinned RNG Seeds: yes</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-slate-500">Local Cached Datasetsap.5%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalysisSidebar() {
  const tabs = [
    { label: "Performance Summary", icon: "+" , active: false },
    { label: "Open-Answer Analysis", icon: "O", active: true },
    { label: "Multiple-Choice Analysis", icon: "*", active: false },
    { label: "Failure Modes", icon: "!", active: false },
  ]

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-2">
        <div className="space-y-1">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                tab.active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                tab.active ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
