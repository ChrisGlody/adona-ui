import { Plus, Settings, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FunctionsTable } from "@/components/function-registry/functions-table"
import { MainNav } from "@/components/main-nav"

export default function FunctionRegistryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 relative overflow-hidden">
        {/* Secondary Navigation */}
        <div className="relative border-b border-primary-foreground/10">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-xl font-semibold text-primary-foreground">
                <span className="font-light">Function Calling</span> As-A-Service
              </h1>
              <div className="flex items-center gap-6">
                <nav className="flex items-center gap-6 text-sm">
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Dashboard
                  </a>
                  <a href="#" className="text-primary-foreground hover:text-primary-foreground transition-colors font-medium">
                    Functions
                  </a>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    API Docs
                  </a>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Support
                  </a>
                </nav>
                <button className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="relative container mx-auto px-6 py-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-2">
                Function Registry
              </h2>
              <p className="text-primary-foreground/70">
                Manage and monitor your registered function calling APIs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2">
                <Plus className="h-4 w-4" />
                Create New Function
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-8">
          <FunctionsTable />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 border-t border-primary-foreground/10 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © 2024 <span className="font-medium text-primary-foreground/80">Function Calling As-A-Service</span>
            </p>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </a>
              <span className="text-primary-foreground/30">|</span>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Terms of Service
              </a>
              <span className="text-primary-foreground/30">|</span>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Contact Us
              </a>
              <span className="text-primary-foreground/30">|</span>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Blog
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
