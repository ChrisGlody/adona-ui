"use client"

import { Card, CardContent } from "@/components/ui/card"

const datasetBreakdown = [
  { dataType: "RNA-Seq (.rds, csv)", taskCount: 35, skillUsage: "53%" },
  { dataType: "Single-Cell (.h5ad)", taskCount: 43, skillUsage: "25%" },
  { dataType: "VCF / Genomics (vcr)", taskCount: 39, skillUsage: "28%" },
  { dataType: "Other (csv)", taskCount: 28, skillUsage: "17%" },
]

const datasetBreakdown2 = [
  { dataType: "RNA-Seq (.rds, csv)", taskCount: 61, skillUsage: "36%" },
  { dataType: "Single-Cell (.h5ad)", taskCount: 43, skillUsage: "25%" },
  { dataType: "VCF / Genomics (vcr)", taskCount: 39, skillUsage: "28%" },
  { dataType: "Other (csv)", taskCount: 28, skillUsage: "17%" },
]

export function DatasetBreakdownTable({ title, data = datasetBreakdown }: { title?: string; data?: typeof datasetBreakdown }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">{title || "Dataset Breakdown by Data Type"}</h3>
        
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs">
              <th className="text-left font-medium pb-2">Data Type</th>
              <th className="text-right font-medium pb-2">Task Count</th>
              <th className="text-right font-medium pb-2">Skill Usage</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {data.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="py-2">{row.dataType}</td>
                <td className="py-2 text-right">{row.taskCount}</td>
                <td className="py-2 text-right">{row.skillUsage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export function DatasetBreakdownTableAlt() {
  return <DatasetBreakdownTable data={datasetBreakdown2} />
}
