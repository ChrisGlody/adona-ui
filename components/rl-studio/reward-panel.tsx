"use client"

import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"

interface RewardPanelProps {
  onClose: () => void
}

export function RewardPanel({ onClose }: RewardPanelProps) {
  return (
    <Card className="w-80 bg-slate-700 border-0 text-white shadow-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Peptide Reward Function</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-600 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Inputs Bound To Reward</h4>
          <div className="space-y-3">
            {["Binding Affinity Score", "Toxicity Penalty", "Expression Filter"].map((input) => (
              <div key={input} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id={input} defaultChecked className="border-slate-400 data-[state=checked]:bg-blue-500" />
                  <label htmlFor={input} className="text-sm text-slate-200">{input}</label>
                </div>
                <div className="w-5 h-5 rounded border border-slate-500 flex items-center justify-center bg-slate-600">
                  <Check className="h-3 w-3 text-blue-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Weighting</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-200">nDCG Weight:</span>
                <span className="text-sm font-semibold">0.8</span>
              </div>
              <Slider defaultValue={[80]} max={100} step={1} className="[&_[role=slider]]:bg-blue-500 [&_.bg-primary]:bg-blue-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-200">Toxicity Penalty:</span>
                <span className="text-sm font-semibold">0.3</span>
              </div>
              <Slider defaultValue={[30]} max={100} step={1} className="[&_[role=slider]]:bg-amber-500 [&_.bg-primary]:bg-amber-500" />
            </div>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3">
          Preview on Sample Data
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1 bg-transparent border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white">
            Cancel
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            Save
          </Button>
        </div>
      </div>
    </Card>
  )
}
