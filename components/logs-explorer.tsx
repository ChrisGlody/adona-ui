"use client"

import { Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type LogLevel = "CRITICAL" | "ERROR" | "WARNING" | "INFO"

interface LogEntry {
  time: string
  level: LogLevel
  message: string
  runId: string
  node: string
  tenant: string
}

const logsData: LogEntry[] = [
  { time: "12:20:48 PM", level: "CRITICAL", message: "Adapter Protein-LoRA failed to load", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne" },
  { time: "12:20:33 PM", level: "ERROR", message: "SSO: Update:runwore failed", runId: "run:1cf23a9b", node: "Research.Data", tenant: "PharmaOne" },
  { time: "12:23:53 PM", level: "WARNING", message: "Error: akresite_prin founa_epi:nest:niitttte", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne" },
  { time: "12:23:53 PM", level: "INFO", message: "Sirtless running failed", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne" },
  { time: "12:28:21 AM", level: "INFO", message: "Source: rigger: nimation failed at load", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne" },
]

const levelColors: Record<LogLevel, { bg: string; text: string; icon: string }> = {
  CRITICAL: { bg: "bg-red-600", text: "text-white", icon: "▲" },
  ERROR: { bg: "bg-orange-500", text: "text-white", icon: "▲" },
  WARNING: { bg: "bg-amber-400", text: "text-amber-900", icon: "▲" },
  INFO: { bg: "bg-blue-500", text: "text-white", icon: "●" },
}

export function LogsExplorer() {
  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-sm">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground">Logs Explorer</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              className="pl-9 bg-muted/50 border-border/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-border/50 bg-transparent">
                Filters
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Critical</DropdownMenuItem>
              <DropdownMenuItem>Error</DropdownMenuItem>
              <DropdownMenuItem>Warning</DropdownMenuItem>
              <DropdownMenuItem>Info</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="border-border/50 bg-transparent">Export to SIEM</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">
                <span className="flex items-center gap-1">Time <ChevronDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="flex items-center gap-1">Level <ChevronDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">
                <span className="flex items-center gap-1">Run ID <ChevronDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="flex items-center gap-1">Node <ChevronDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="flex items-center gap-1">Tenant <ChevronDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Tenant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logsData.map((log, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">{log.time}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${levelColors[log.level].bg} ${levelColors[log.level].text}`}>
                    <span className="text-[10px]">{levelColors[log.level].icon}</span>
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground max-w-xs truncate">{log.message}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.runId}</td>
                <td className="px-4 py-3 text-foreground">{log.node}</td>
                <td className="px-4 py-3 text-foreground">{log.tenant}</td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" className="text-xs border-border/50 bg-transparent">
                    Manage <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Showing 24 of 924 logs (1 of 39)</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium">1</span>
          <span className="text-sm text-muted-foreground px-2">of 4</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground">5</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
