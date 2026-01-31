"use client";

import "../lib/amplify-config";

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
