"use client"

import { useState } from "react"
import { Workflow, ChevronRight, Search, Download, Copy, ExternalLink, FileText, RefreshCw, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const fastaContent = `for OClaas.
>1STK-EIKQ SIVORS... mh5.
1.CraFsIeur .1'FLGIFI Gurt.shen a'poefeFreest_hnmd.cerwerlaforter: Ella spretltue
BKOPS.Me. PsSCMArC;.Iwnhcrsi~Suuzu.
IWL-FOpr. EIN&ITHO(G$1.'PASEEEPH.31k;soofaven:cporteethag:3501 48-4465.
+ pacergfifiss.'- .3536-48. IIBbI, fifase &;...59633 Opur. Omoj smseIcladons`

export function RunDetailPanel() {
  const [activeTab, setActiveTab] = useState("node-results")

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="font-medium">Run ID</span>
          <span className="font-mono text-primary">PSP-159840</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span>Workflow</span>
          <span className="font-mono text-primary">1.1</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Workflow className="h-4 w-4 text-amber-500" />
          <span className="text-primary">Protein Structure Predictor</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">PSP-159840</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Search className="h-4 w-4 mr-1" />
            Search details
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 divide-x divide-border">
        {/* Left: Input Content */}
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            {["Inputs", "Node Results", "Logs", "Artifacts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.toLowerCase().replace(" ", "-")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="border border-border rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Protein FASTA</span>
                <span className="text-muted-foreground text-sm">(fasta)</span>
                <span className="text-muted-foreground text-xs">- 377 a an 956.3</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className="text-xs text-muted-foreground font-mono bg-slate-50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
              {fastaContent}
            </pre>
          </div>

          <div className="flex gap-2 mb-3">
            {["Inputs", "Node Results", "Logs", "Artifacts"].map((tab, i) => (
              <button
                key={tab}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Protein FASTA</span>
                <span className="text-muted-foreground text-sm">(fasta)</span>
                <span className="text-muted-foreground text-xs">23.3 KB</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Workflow Diagram */}
        <div className="p-4 bg-slate-50/50">
          <div className="relative h-80">
            {/* BoltzFold Node */}
            <div className="absolute top-4 left-1/3 bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
              <span className="font-medium">BoltzFold</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            
            {/* SENSIS RATA label */}
            <div className="absolute top-14 left-1/3 ml-16 text-xs text-muted-foreground bg-white px-2 py-1 rounded border">
              SENSIS RATA
            </div>

            {/* ProteinStruct Predictor */}
            <div className="absolute top-24 right-12 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="font-medium">ProteinStruct</div>
              <div className="text-xs opacity-90">Predictor Skill</div>
              <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                75.35% confident
              </div>
            </div>

            {/* ProteinStruct Left */}
            <div className="absolute top-48 left-16 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-md">
              <div className="font-medium">ProteinStruct</div>
              <div className="text-xs opacity-90">Predictor Skill</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                Deterministic
              </div>
            </div>

            {/* Vivermealiste label */}
            <div className="absolute top-56 right-24 text-xs text-muted-foreground">
              Vivermealiste: FDB FII:
            </div>

            {/* RAG DB */}
            <div className="absolute bottom-8 right-12 bg-rose-500 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/50 rounded" />
                <div>
                  <div className="font-medium">RAG DB:</div>
                  <div className="text-xs opacity-90">Research Papest DD</div>
                </div>
              </div>
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
              <path d="M 180 50 Q 250 100 280 140" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4" />
              <path d="M 120 200 Q 200 180 260 150" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4" />
              <path d="M 300 180 L 300 220" stroke="#94a3b8" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
