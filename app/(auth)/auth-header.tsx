"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function AuthHeader() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href="/login" className="flex items-center gap-2">
        <Image
          src="/adona-logo.png"
          alt="Adona AI"
          width={140}
          height={42}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>
      <Link
        href={isLogin ? "/register" : "/login"}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isLogin ? "Sign up" : "Sign in"}
      </Link>
    </header>
  );
}
