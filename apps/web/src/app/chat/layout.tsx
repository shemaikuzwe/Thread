"use client";

import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatWebsocketProvider, useWebsocket } from "@/hooks/websocket-provider";

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  useWebsocket();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full">
        <ChatSidebar />
        {children}
      </div>
    </SidebarProvider>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatWebsocketProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ChatWebsocketProvider>
  );
}
