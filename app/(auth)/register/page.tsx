"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signUp, confirmSignUp } from "aws-amplify/auth";
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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"signUp" | "confirm">("signUp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCognitoConfigured) {
        await signUp({ username: email, password });
        setStep("confirm");
      } else {
        await fetch("/api/auth/set-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "mock-auth-token" }),
        });
        router.replace("/links");
      }
    } catch {
      setError(isCognitoConfigured ? "Sign up failed. Email may already be in use." : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      router.replace("/login");
    } catch {
      setError("Invalid or expired confirmation code.");
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
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isCognitoConfigured
              ? "Sign up with your email. You’ll receive a confirmation code."
              : "Use mock sign up to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {step === "signUp" ? (
            <>
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
                  autoComplete="new-password"
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive font-medium">{error}</p>
              ) : null}
              <Button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full h-11 font-medium"
              >
                {loading ? "Creating account…" : "Sign up"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">
                  Confirmation code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code from email"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-background border-border"
                  autoComplete="one-time-code"
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive font-medium">{error}</p>
              ) : null}
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-11 font-medium"
              >
                {loading ? "Confirming…" : "Confirm sign up"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("signUp")}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      {!isCognitoConfigured && (
        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Demo credentials (mock sign up)</p>
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
