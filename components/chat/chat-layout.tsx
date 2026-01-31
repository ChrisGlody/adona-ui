"use client";

import Link from "next/link";
import { Brain, SquarePenIcon, Menu, Wrench } from "lucide-react";
import Chat from "./chat-main";
import type { UIMessage } from "ai";
import UserButton from "@/components/user-button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

function SidebarContent({
  userChats,
  currentChatId,
  onChatSelect,
}: {
  userChats: { id: string; title?: string | null }[];
  currentChatId: string;
  onChatSelect?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="flex items-center gap-2 px-2 py-1">
          <Link href="/links" className="flex items-center gap-2" onClick={onChatSelect}>
            <Brain className="w-6 h-6 text-foreground" />
          </Link>
        </div>
        <div>
          <Link
            href="/chat"
            className="hover:bg-muted px-2 py-2 rounded-md text-sm flex items-center gap-2 mt-4 text-foreground"
            onClick={onChatSelect}
          >
            <SquarePenIcon className="w-4 h-4" />
            New chat
          </Link>
          <Link
            href="/tools"
            className="hover:bg-muted px-2 py-2 rounded-md text-sm flex items-center gap-2 text-foreground"
            onClick={onChatSelect}
          >
            <Wrench className="w-4 h-4" />
            Tools
          </Link>
        </div>
        <div className="space-y-1 mt-4">
          <span className="text-sm text-muted-foreground px-2">Chats</span>
          {userChats.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`block px-2 py-2 rounded-md text-sm hover:bg-muted whitespace-nowrap overflow-hidden text-ellipsis ${
                c.id === currentChatId ? "bg-muted" : "text-foreground"
              }`}
              onClick={onChatSelect}
            >
              {c.title ?? "Untitled chat"}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex gap-2 items-center border-t border-border p-3 mt-auto">
        <UserButton />
      </div>
    </div>
  );
}

export function ChatLayout({
  id,
  initialMessages,
  userChats,
}: {
  id: string;
  initialMessages: UIMessage[];
  userChats: { id: string; title?: string | null }[];
}) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      <aside
        className={`h-screen sticky w-64 border-r border-border overflow-y-auto bg-card ${
          isMobile ? "hidden" : "block"
        }`}
      >
        <SidebarContent userChats={userChats} currentChatId={id} />
      </aside>
      <main className="flex-1 flex flex-col">
        {isMobile && (
          <header className="border-b border-border p-4 bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-card">
                  <SidebarContent
                    userChats={userChats}
                    currentChatId={id}
                    onChatSelect={() => setIsSheetOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <Link href="/links" className="flex items-center gap-2">
                <Brain className="w-6 h-6" />
              </Link>
              <div className="w-10" />
            </div>
          </header>
        )}
        <div className="flex-1">
          <Chat id={id} initialMessages={initialMessages} />
        </div>
      </main>
    </div>
  );
}
