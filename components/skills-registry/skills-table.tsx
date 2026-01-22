"use client"

import { useState } from "react"
import { Search, Trash2, Settings, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Mail, Briefcase, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const skills = [
  {
    id: "1",
    name: "Customer Feedback Sentiment Analyzer",
    description: "Analyzes customer feedback and generates sentiment reports.",
    status: "Active",
    created: "April 24, 2024",
    runs: "1,230 runs",
    runsPerDay: "20.5/day",
    icon: MessageSquare,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: "2",
    name: "Scheduled Email Sender",
    description: "Schedules and send emails at at specified times.",
    status: "Active",
    created: "April 22, 2024",
    runs: "890 runs",
    runsPerDay: "15.2/day",
    icon: Mail,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "3",
    name: "Job Skills Extractor",
    description: "Extracts required skills from top job descriptions.",
    status: "Active",
    created: "April 20, 2024",
    runs: "650 runs",
    runsPerDay: "10.8/day",
    icon: Briefcase,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "4",
    name: "Real-Time Market Trend Alert",
    description: "Tracks and alerts user-defined market trends in real-time.",
    status: "Active",
    created: "April 18, 2024",
    runs: "1,100 runs",
    runsPerDay: "18.3/day",
    icon: TrendingUp,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
]

export function SkillsTable() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedSkills.length === skills.length) {
      setSelectedSkills([])
    } else {
      setSelectedSkills(skills.map((s) => s.id))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 bg-slate-100/80 border-b">
        <Settings className="h-4 w-4 text-slate-500" />
        <span className="font-medium text-slate-700">Skill Name</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50/50">
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedSkills.length === skills.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                <button className="flex items-center gap-1 hover:text-slate-900">
                  Skill Name
                  <ChevronDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Description</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                <button className="flex items-center gap-1 hover:text-slate-900">
                  Status
                  <ChevronDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                <button className="flex items-center gap-1 hover:text-slate-900">
                  Created
                  <ChevronDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                <button className="flex items-center gap-1 hover:text-slate-900">
                  Usage
                  <ChevronDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => {
              const Icon = skill.icon
              return (
                <tr key={skill.id} className="border-b hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedSkills.includes(skill.id)}
                      onCheckedChange={() => toggleSkill(skill.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${skill.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${skill.iconColor}`} />
                      </div>
                      <span className="font-semibold text-slate-800">{skill.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 max-w-xs">
                    {skill.description}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {skill.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{skill.created}</td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-slate-800">{skill.runs}</div>
                      <div className="text-slate-500">{skill.runsPerDay}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                        <Search className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>1-4 of 4</span>
          <span className="text-slate-400">|</span>
          <span>10 rows/page</span>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="10">
            <SelectTrigger className="w-20 h-8 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-blue-600 text-white hover:bg-blue-700">
              1
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
