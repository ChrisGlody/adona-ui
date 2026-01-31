"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { isCognitoConfigured } from "@/lib/cognito-config";

export default function UserButton() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        if (isCognitoConfigured) {
          try {
            const user = await getCurrentUser();
            setUsername(user.signInDetails?.loginId ?? user.username ?? "user");
          } catch {
            // Not signed in with Amplify; fall back to server cookie (e.g. after page refresh)
            const res = await fetch("/api/secure");
            if (res.ok) {
              const data = await res.json();
              setUsername(data.user?.email ?? data.user?.sub ?? "user");
            }
          }
          return;
        }
        const res = await fetch("/api/secure");
        if (res.ok) {
          const data = await res.json();
          setUsername(data.user?.email ?? data.user?.sub ?? "mock user");
        }
      } catch {
        // ignore
      }
    })();
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
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{username}</span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
