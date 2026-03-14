import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useWebsocket } from "@/hooks/use-weboscket";
import { useEffect } from "react";
import { Outlet } from "react-router";
export default function ChatLayout() {
  const { readyState } = useWebsocket();

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      console.log("websocket connected");
    }
  }, [readyState]);
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex  h-screen w-full">
        <ChatSidebar />
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
