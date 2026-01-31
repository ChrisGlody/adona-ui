"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { isCognitoConfigured } from "@/lib/cognito-config";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        if (isCognitoConfigured) {
          await signOut();
        }
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore
      } finally {
        router.replace("/login");
      }
    })();
  }, [router]);

  return null;
}
