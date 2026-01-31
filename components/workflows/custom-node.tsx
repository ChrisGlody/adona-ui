"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Code, Brain, Database, Cpu, Wrench, Sparkles } from "lucide-react";

// Color themes for different node types
const nodeThemes: Record<string, { bg: string; iconBg: string; text: string }> = {
  tool: {
    bg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    iconBg: "bg-indigo-400/50",
    text: "text-white",
  },
  inline: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    iconBg: "bg-blue-400/50",
    text: "text-white",
  },
  memory: {
    bg: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconBg: "bg-purple-400/50",
    text: "text-white",
  },
  llm: {
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-400/50",
    text: "text-white",
  },
  inference: {
    bg: "bg-gradient-to-br from-orange-400 to-orange-500",
    iconBg: "bg-orange-300/50",
    text: "text-white",
  },
  default: {
    bg: "bg-gradient-to-br from-slate-500 to-slate-600",
    iconBg: "bg-slate-400/50",
    text: "text-white",
  },
};

// Icons for different node types
const nodeIcons: Record<string, React.ElementType> = {
  tool: Wrench,
  inline: Code,
  memory: Database,
  llm: Sparkles,
  inference: Cpu,
  default: Brain,
};

// Type labels
const typeLabels: Record<string, string> = {
  tool: "Tool",
  inline: "Inline Code",
  memory: "Memory",
  llm: "LLM",
  inference: "Inference",
};

interface CustomNodeData {
  label: string;
  type?: string;
  status?: "pending" | "running" | "completed" | "failed";
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const nodeType = data.type || "default";
  const theme = nodeThemes[nodeType] || nodeThemes.default;
  const Icon = nodeIcons[nodeType] || nodeIcons.default;
  const typeLabel = typeLabels[nodeType] || nodeType;

  // Get first letter for the circular icon
  const firstLetter = data.label?.charAt(0).toUpperCase() || "N";

  // Status badge colors
  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    running: "bg-blue-100 text-blue-600",
    completed: "bg-emerald-100 text-emerald-600",
    failed: "bg-red-100 text-red-600",
  };

  return (
    <div className="relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white"
      />

      {/* Node Card */}
      <div
        className={`
          min-w-[180px] max-w-[220px] rounded-xl shadow-lg
          ${theme.bg} ${theme.text}
          ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-100" : ""}
          transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
        `}
      >
        <div className="p-4 flex items-center gap-3">
          {/* Circular Icon */}
          <div
            className={`
              w-10 h-10 rounded-full ${theme.iconBg}
              flex items-center justify-center
              font-bold text-lg
            `}
          >
            {firstLetter}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{data.label}</div>
            <div className="text-xs opacity-80 flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {typeLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge (shown below node if status exists) */}
      {data.status && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full
              text-xs font-medium shadow-sm border border-slate-200/50
              ${statusColors[data.status] || statusColors.pending}
            `}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                data.status === "running"
                  ? "bg-blue-500 animate-pulse"
                  : data.status === "completed"
                  ? "bg-emerald-500"
                  : data.status === "failed"
                  ? "bg-red-500"
                  : "bg-slate-400"
              }`}
            />
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </span>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(CustomNode);
