import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
export default function ChatLayout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex  h-screen w-full">
        <ChatSidebar />
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
