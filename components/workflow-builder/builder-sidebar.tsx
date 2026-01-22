"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  LayoutDashboard,
  FileText,
  GitBranch,
  Grid3X3,
  MoreHorizontal,
  Settings,
} from "lucide-react"

const sidebarItems = [
  { icon: Menu, href: "#" },
  { icon: LayoutDashboard, href: "/" },
  { icon: FileText, href: "/workflow-runs" },
  { icon: GitBranch, href: "/workflow-builder", active: true },
  { icon: Grid3X3, href: "/rl-studio" },
  { icon: MoreHorizontal, href: "#" },
]

export function BuilderSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-14 bg-slate-700 flex flex-col items-center py-4 gap-1">
      {sidebarItems.map((item, index) => {
        const Icon = item.icon
        const isActive = item.href === pathname
        return (
          <Link
            key={index}
            href={item.href}
            className={`p-3 rounded-lg transition-colors ${
              isActive
                ? "bg-slate-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </Link>
        )
      })}

      <div className="flex-1" />

      <Link
        href="#"
        className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </div>
  )
}
