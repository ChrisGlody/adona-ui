"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { isCognitoConfigured } from "@/lib/cognito-config";
import { LogOut, Mail } from "lucide-react";

export default function UserButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        if (isCognitoConfigured) {
          try {
            const user = await getCurrentUser();
            const loginId = user.signInDetails?.loginId ?? user.username ?? "user";
            setUsername(loginId);
            setEmail(loginId.includes("@") ? loginId : null);
          } catch {
            // Not signed in with Amplify; fall back to server cookie (e.g. after page refresh)
            const res = await fetch("/api/secure");
            if (res.ok) {
              const data = await res.json();
              setUsername(data.user?.email ?? data.user?.sub ?? "user");
              setEmail(data.user?.email ?? null);
            }
          }
          return;
        }
        const res = await fetch("/api/secure");
        if (res.ok) {
          const data = await res.json();
          setUsername(data.user?.email ?? data.user?.sub ?? "mock user");
          setEmail(data.user?.email ?? null);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (isCognitoConfigured) {
        await signOut();
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  // Get initials from username/email
  const getInitials = (name: string) => {
    if (name.includes("@")) {
      return name.split("@")[0].slice(0, 2).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (username == null) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Login
        </Button>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {getInitials(username)}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-4 py-4 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
                {getInitials(username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {username.includes("@") ? username.split("@")[0] : username}
                </p>
                {email && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="py-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
