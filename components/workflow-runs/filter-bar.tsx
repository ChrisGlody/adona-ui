"use client"

import { Search, SlidersHorizontal, Calendar, Grid, List, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function FilterBar() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Run ID</span>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded">PSP-159840</span>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <span className="font-bold text-lg">M</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] h-9">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Status</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="april">
          <SelectTrigger className="w-[150px] h-9">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>April 2024</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="april">April 2024</SelectItem>
            <SelectItem value="march">March 2024</SelectItem>
            <SelectItem value="february">February 2024</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <Grid className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Run ID" className="pl-9 h-9" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="font-mono text-primary">0x8755da</span>
        </div>
      </div>
    </div>
  )
}
