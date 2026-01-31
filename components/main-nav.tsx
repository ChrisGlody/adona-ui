"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Activity, Workflow, Play, Bell, GitBranch, Zap, Sparkles, FlaskConical, Wand2, LayoutDashboard, MessageSquare, Wrench, GitFork, Search, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserButton from "@/components/user-button"

const navItems = [
  //{ href: "/", label: "Observability", icon: Activity },
  //{ href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/workflows", label: "Workflows", icon: GitFork },
  { href: "/workflow-runs", label: "Runner", icon: Play },
  { href: "/tools", label: "Tools", icon: Wrench },
  //{ href: "/ai/workflows", label: "AIWorkflows", icon: Workflow },
  { href: "/hybrid-search", label: "Hybrid", icon: Search },
  { href: "/deterministic-inference", label: "Determinisme", icon: Calculator },
  //{ href: "/rl-studio", label: "RL", icon: Workflow },

  { href: "/workflow-builder", label: "Builder", icon: GitBranch },
  //{ href: "/function-registry", label: "Functions", icon: Zap },
  //{ href: "/skills-registry", label: "Skills", icon: Sparkles },
  //{ href: "/bixbench", label: "BixBench", icon: FlaskConical },
  //{ href: "/skill-designer", label: "Skill", icon: Wand2 },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/adona-logo.png"
                alt="Adona AI"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>

            {/* Main Navigation */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>
            <Link href="/links">
              <Button variant="default">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </div>
          Right Side */}
        </div>
      </div>
    </nav>
  )
}
