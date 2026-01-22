"use client"

import { useState } from "react"
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const functions = [
  {
    id: 1,
    name: "Weather Forecast",
    description: "Fetches weather data for a specified location.",
    status: "Active",
    created: "April 24, 2024",
    calls: "5,320",
    callsPerDay: "91.2/day",
    latency: "350ms",
    latencyAlt: "350msh",
    icon: Sun,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: 2,
    name: "Stock Price Checker",
    description: "Retrieves real-time stock prices of specified companies.",
    status: "Active",
    created: "April 22, 2024",
    calls: "4,750",
    callsPerDay: "81.7/day",
    latency: "490ms",
    latencyAlt: "490msh",
    icon: TrendingUp,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 3,
    name: "News Article Summarizer",
    description: "Summarizes news articles into concise summaries.",
    status: "Active",
    created: "April 21, 2024",
    calls: "3,980",
    callsPerDay: "68.2/day",
    latency: "600ms",
    latencyAlt: "600msh",
    icon: FileText,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    id: 4,
    name: "Customer Support Ticket Creator",
    description: "Creates support tickets from user inquiries.",
    status: "Active",
    created: "April 20, 2024",
    calls: "2,610",
    callsPerDay: "42.2/day",
    latency: "420ms",
    latencyAlt: "420msh",
    icon: MessageSquare,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
]

export function FunctionsTable() {
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [rowsPerPage, setRowsPerPage] = useState("10")

  const toggleRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === functions.length ? [] : functions.map((f) => f.id)
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200">
        <Settings className="h-5 w-5 text-slate-500" />
        <span className="font-semibold text-slate-800">Function Registry</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-4 text-left">
                <Checkbox
                  checked={selectedRows.length === functions.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Function Name
                <span className="ml-1 text-slate-400">↕</span>
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Description
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Status
                <span className="ml-1 text-slate-400">↕</span>
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Created
                <span className="ml-1 text-slate-400">↕</span>
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Calls
                <span className="ml-1 text-slate-400">↕</span>
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Latency
                <span className="ml-1 text-slate-400">↕</span>
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-slate-600">
                Endpoints
                <span className="ml-1 text-slate-400">↕</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {functions.map((func) => {
              const Icon = func.icon
              return (
                <tr
                  key={func.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedRows.includes(func.id)}
                      onCheckedChange={() => toggleRow(func.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${func.iconBg} flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${func.iconColor}`} />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {func.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 max-w-xs">
                    {func.description}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {func.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {func.created}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <span className="font-medium text-slate-800">
                        {func.calls}
                      </span>
                      <br />
                      <span className="text-slate-500">{func.callsPerDay}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <span className="font-medium text-slate-800">
                        {func.latency}
                      </span>
                      <br />
                      <span className="text-slate-500">{func.latencyAlt}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-blue-200 hover:bg-blue-50 bg-transparent"
                      >
                        <Search className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-200 hover:bg-slate-50 bg-transparent"
                      >
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-red-200 hover:bg-red-50 bg-transparent"
                      >
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>1–4 of 4</span>
          <span className="text-slate-400">|</span>
          <span className="font-medium">10</span>
          <span>rows page</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
