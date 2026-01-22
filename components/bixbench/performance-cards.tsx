"use client"

import { FileText, CheckSquare, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function PerformanceCards() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Performance Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-600">76.2%</div>
                <div className="text-sm font-medium text-slate-700 mt-1">Open-Answer Accuracy</div>
                <div className="text-xs text-slate-500 mt-1">
                  Correct freeform answers out of 200 total questions
                </div>
              </div>
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "76.2%" }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-600">84.4%</div>
                <div className="text-sm font-medium text-slate-700 mt-1">Multiple-Choice Accuracy</div>
                <div className="text-xs text-slate-500 mt-1">
                  Correct MCQ answers out of 200 total questions
                </div>
              </div>
              <CheckSquare className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "84.4%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ConsistencyCard() {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800">100%</span>
              <span className="text-lg text-slate-600">Answer Consistency</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Same inputs produced the same answers across 5 parallel runs
            </p>
          </div>
          <Star className="h-5 w-5 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  )
}
