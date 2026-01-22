"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function SettingsPanel() {
  const [workflowName, setWorkflowName] = useState("New Workflow")
  const [environment, setEnvironment] = useState("production")
  const [description, setDescription] = useState("")

  return (
    <div className="w-72 bg-white border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Workflow Settings</h2>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Workflow Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Workflow Name</label>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Running Environment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Running Environment</label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Description...</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this workflow..."
            className="min-h-[120px] bg-white resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-border">
        <Button className="w-full bg-primary hover:bg-primary/90">
          Save Workflow
        </Button>
      </div>
    </div>
  )
}
