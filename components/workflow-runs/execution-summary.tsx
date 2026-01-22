"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const logEntries = [
  { time: "2024-022-24 16:24", text: "TREEMEETING" },
  { time: "2020-122-34 10.24", text: "!model snipprics, 33.27-58467-23023:2morutais urh q OAFKEEP- -1f43020 grOocda Secorrts .ertepriuses" },
  { time: "2028-04-24 16:24", text: "TREEMEETING" },
  { time: "2026-00%, Claping for nrcodation, inbes erito consrtains meotrtnahing ism prouts, Helps: Helper fouet and tterinthase" },
  { time: "2024-48-15 10.24", text: "TREEMEETING" },
  { time: "2024-63-24 10:24, NERIUTHAtca tesites onftopoode meirq orte moztaze, N13 5534" },
  { time: "2021-08-34 10.24", text: "TREEMEETING" },
  { time: "3524-06-34 10:24, NERIUTHAtca tesites caticoordamoozatte: t.10.28.-r/2.3.9422." },
  { time: "2024-03-15 10.24", text: "TREEMEETING" },
  { time: "3534-04-18 10:38 Compninune. 115.2ess" },
]

export function ExecutionSummary() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 h-fit">
      <h3 className="font-semibold text-foreground mb-4">Execution: Summary</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">Determinism</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="boltzfold" defaultChecked className="border-primary data-[state=checked]:bg-primary" />
                <label htmlFor="boltzfold" className="text-sm text-foreground">Boilzfold</label>
              </div>
              <span className="text-xs text-muted-foreground">20 -</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="research" defaultChecked className="border-primary data-[state=checked]:bg-primary" />
                <label htmlFor="research" className="text-sm text-foreground">Research Papess DB</label>
              </div>
              <span className="text-xs text-muted-foreground">dinprimed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Search details</span>
          <span className="text-sm font-mono text-primary">0x8756da</span>
        </div>

        <ScrollArea className="h-64 border-t border-border pt-3">
          <div className="space-y-2 text-xs">
            {logEntries.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-red-500">*</span>
                <span className="text-muted-foreground break-all">{entry.time} {entry.text}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
