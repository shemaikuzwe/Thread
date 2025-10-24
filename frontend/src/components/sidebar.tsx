import { Home, MessageCircle, MoreHorizontal, Bell } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import User from "./ui/user";
import Logo from "@/assets/logo2.png";

// Menu items
const items = [
  {
    title: "Home",
    icon: Home,
  },
  {
    title: "DMs",
    icon: MessageCircle,
  },
  {
    title: "Notifications",
    icon: Bell,
  },
  {
    title: "More",
    icon: MoreHorizontal,
  },
];

export function ChatSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <img src={Logo} alt="Logo" className="h-8 w-20" />
      </SidebarHeader>
      <SidebarContent className="mt-20">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex justify-center items-center w-full h-full flex-col gap-5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    // className="justify-center"
                  >
                    <item.icon className="h-20 w-20" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <User />
      </SidebarFooter>
    </Sidebar>
  );
}
