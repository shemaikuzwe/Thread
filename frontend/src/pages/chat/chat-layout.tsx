import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import ChatsList from "./chats";

export default function ChatLayout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex flex-row h-screen w-full">
        <ChatSidebar />
        <ChatsList />
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
