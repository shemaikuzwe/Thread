"use client";

import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useWebsocket } from "@/hooks/use-weboscket";
import { useEffect } from "react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { readyState } = useWebsocket();

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      console.log("websocket connected");
    }
  }, [readyState]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full">
        <ChatSidebar />
        {children}
      </div>
    </SidebarProvider>
  );
}
