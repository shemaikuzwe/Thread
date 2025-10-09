import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import ChatsList from "./chats";
import { auth } from "@/_auth";

export async function loader() {
  await auth();
}
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
