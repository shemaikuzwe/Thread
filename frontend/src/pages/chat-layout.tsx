import { useSession } from "@/components/providers/session-provider";
import { ChatSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import ChatsList from "./chats";

export default function ChatLayout() {
  const session = useSession();
  const navigate = useNavigate();
  if (!session || session.status === "un_authenticated") {
    navigate("/login", { replace: true });
  }
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
