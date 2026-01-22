import Link from "next/link"
import { Plus, User, ChevronDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { SkillsTable } from "@/components/skills-registry/skills-table"

export default function SkillsRegistryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      {/* Gradient background section */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 relative overflow-hidden">
        {/* Secondary Navigation */}
        <nav className="relative z-10 border-b border-primary-foreground/10">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <span className="text-xl font-light text-primary-foreground">
                  <span className="font-semibold">Agent Skills</span> As-A-Service
                </span>
                <div className="flex items-center gap-6">
                  <Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Link href="#" className="text-sm text-primary-foreground font-medium">
                    Skills
                  </Link>
                  <Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    API Docs
                  </Link>
                  <Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Support
                  </Link>
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <User className="h-4 w-4" />
                Account
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </nav>

        {/* Header Section */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground mb-3">Skills Registry</h1>
              <p className="text-primary-foreground/70">
                Manage and monitor your registered AI skills.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2">
                <Plus className="h-4 w-4" />
                Create New Skill
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-8">
          <SkillsTable />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 border-t border-primary-foreground/10 py-6 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © 2024 <span className="font-semibold text-primary-foreground/80">Agent Skills As-A-Service</span>
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-primary-foreground/30">|</span>
              <Link href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
              <span className="text-primary-foreground/30">|</span>
              <Link href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Contact Us
              </Link>
              <span className="text-primary-foreground/30">|</span>
              <Link href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
