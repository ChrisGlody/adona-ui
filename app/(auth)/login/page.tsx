"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, fetchAuthSession } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCognitoConfigured } from "@/lib/cognito-config";

const MOCK_AUTH_TOKEN = "mock-auth-token";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/workflows";

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCognitoConfigured) {
        await signIn({ username: email, password });
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          await fetch("/api/auth/set-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
        router.replace(from);
        return;
      }

      // Mock login when Cognito not configured
      await fetch("/api/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: MOCK_AUTH_TOKEN }),
      });
      router.replace(from);
    } catch (err: unknown) {
      const errName = typeof err === "object" && err !== null && "name" in err ? String((err as { name?: string }).name) : "";
      if (errName === "UserAlreadyAuthenticatedException") {
        router.replace(from);
        return;
      }
      setError(isCognitoConfigured ? "Invalid email or password." : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/15%,transparent)]" />
      <Card className="border-border bg-card shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto mb-4 flex justify-center">
            <Image
              src="/adona-logo.png"
              alt="Adona AI"
              width={160}
              height={48}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to continue to Adona AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border"
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive font-medium">{error}</p>
          ) : null}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 font-medium"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

      {!isCognitoConfigured && (
        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Demo credentials (mock login)</p>
          <p className="text-sm text-muted-foreground font-mono">
            Email: <span className="text-foreground">demo@adona.ai</span>
            <br />
            Password: <span className="text-foreground">demo</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Any email and password work when Cognito is not configured.
          </p>
        </div>
      )}
    </div>
  );
}
