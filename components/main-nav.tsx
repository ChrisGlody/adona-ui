"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Workflow, Play, Bell, User, GitBranch, Zap, Sparkles, FlaskConical, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Observability", icon: Activity },
  { href: "/rl-studio", label: "RL Studio", icon: Workflow },
  { href: "/workflow-runs", label: "Workflow Runs", icon: Play },
  { href: "/workflow-builder", label: "Workflow Builder", icon: GitBranch },
  { href: "/function-registry", label: "Functions", icon: Zap },
  { href: "/skills-registry", label: "Skills", icon: Sparkles },
  { href: "/bixbench", label: "BixBench", icon: FlaskConical },
  { href: "/skill-designer", label: "Skill Designer", icon: Wand2 },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Y</span>
              </div>
              <span className="font-semibold text-foreground">YourCompany</span>
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

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Get Started
            </Button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
