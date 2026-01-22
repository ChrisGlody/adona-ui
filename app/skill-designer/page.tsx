"use client"

import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { User, ChevronDown, Sparkles } from "lucide-react"

export default function SkillDesignerPage() {
  const [prompt, setPrompt] = useState("Create a skill to monitor social media for brand mentions and send alerts for trending topics.")
  const [isGenerated, setIsGenerated] = useState(true)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      
      {/* Secondary Navigation */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-8 h-8">
                  <ellipse cx="20" cy="18" rx="14" ry="12" fill="#e8b4b8" />
                  <path d="M8 18 Q8 8 20 8 Q32 8 32 18" fill="#4a90d9" />
                  <path d="M10 16 Q10 10 20 10 Q30 10 30 16" fill="#6ba3e0" />
                  <circle cx="14" cy="14" r="2" fill="#fff" opacity="0.6" />
                  <path d="M18 22 Q20 24 22 22" stroke="#333" fill="none" strokeWidth="1" />
                </svg>
              </div>
              <span className="font-semibold text-lg text-primary-foreground">Agent Skills As-A-Service</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Dashboard</a>
              <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">My Skills</a>
              <a href="#" className="text-sm text-primary-foreground bg-primary-foreground/20 px-3 py-1.5 rounded hover:bg-primary-foreground/30 transition-colors">API Docs</a>
              <button className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground">
                <User className="h-4 w-4" />
                Admin
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Design a New Skill <span className="font-normal text-primary-foreground/70">with GPT-5</span>
          </h1>
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-primary-foreground/50 to-transparent mx-auto mb-4" />
          <p className="text-primary-foreground/70">
            Describe the skill you want to create, and let GPT-5 generate it for you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex gap-3 bg-white rounded-full shadow-lg border border-slate-200 p-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the skill you want to create..."
              className="flex-1 border-0 shadow-none text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 px-4"
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              onClick={() => setIsGenerated(true)}
            >
              Generate Skill
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200 my-8" />

        {/* Generated Skill Section */}
        {isGenerated && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              Generated Skill: <span className="text-slate-600">Social Media Monitor</span>
            </h2>

            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Illustration */}
                  <div className="md:w-2/5 p-8 flex items-center justify-center bg-slate-50 rounded-l-lg">
                    <div className="relative">
                      {/* Phone */}
                      <div className="w-32 h-48 bg-slate-800 rounded-2xl border-4 border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-2 bg-white rounded-lg p-2">
                          <div className="space-y-2">
                            <div className="h-2 bg-slate-200 rounded w-3/4" />
                            <div className="h-2 bg-slate-200 rounded w-1/2" />
                            <div className="h-2 bg-slate-200 rounded w-2/3" />
                            <div className="flex gap-1 mt-3">
                              <div className="w-4 h-4 bg-blue-100 rounded" />
                              <div className="w-4 h-4 bg-green-100 rounded" />
                              <div className="w-4 h-4 bg-orange-100 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Icons */}
                      <div className="absolute -top-4 -left-6 w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <span className="text-lg font-bold">#</span>
                      </div>
                      <div className="absolute top-8 -left-8 w-8 h-8 bg-rose-400 rounded-full flex items-center justify-center text-white shadow-lg">
                        <span className="text-xs">...</span>
                      </div>
                      <div className="absolute -top-2 right-0 w-9 h-9 bg-rose-400 rounded-full flex items-center justify-center text-white shadow-lg">
                        <span className="text-sm">?</span>
                      </div>
                      <div className="absolute top-12 -right-6 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                        </svg>
                      </div>
                      <div className="absolute top-1/2 -right-10 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-8 -left-4 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute bottom-4 left-1/2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute bottom-0 -right-4 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      {/* Decorative circles */}
                      <div className="absolute -bottom-2 left-1/4 w-3 h-3 bg-slate-300 rounded-full opacity-60" />
                      <div className="absolute bottom-6 -right-12 w-2 h-2 bg-slate-300 rounded-full opacity-60" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="md:w-3/5 p-8 border-l border-slate-200">
                    <div className="space-y-6">
                      <div>
                        <span className="font-semibold text-slate-800">Description: </span>
                        <span className="text-slate-600">Monitors social media platforms for brand mentions and alerts on trending topics.</span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 mb-2">Functions:</p>
                        <ul className="space-y-1 text-slate-600">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            Track Brand Mentions
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            Analyze Trending Topics
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            Send Instant Alerts
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 mb-2">Settings:</p>
                        <ul className="space-y-1 text-slate-600">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            <span className="font-medium">Platforms:</span> Twitter, Facebook, Instagram
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            <span className="font-medium">Alert Frequency:</span> Real-time
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            <span className="font-medium">Keyword Filters:</span> Brand & Trending Keywords
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base">
                          Register Skill
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
