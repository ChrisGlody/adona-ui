import { Home, Sparkles } from "lucide-react"

export function DashboardFooter() {
  return (
    <footer className="bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="font-semibold">YourCompany</span>
          </div>
          <span className="text-primary-foreground/60">|</span>
          <nav className="flex items-center gap-4 text-sm text-primary-foreground/80">
            <a href="#" className="hover:text-primary-foreground transition-colors">Status</a>
            <span className="text-primary-foreground/40">·</span>
            <a href="#" className="hover:text-primary-foreground transition-colors">Docs</a>
            <span className="text-primary-foreground/40">·</span>
            <a href="#" className="hover:text-primary-foreground transition-colors">Support</a>
            <span className="text-primary-foreground/40">·</span>
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy</a>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">YourCompany</span>
        </div>
      </div>
    </footer>
  )
}
