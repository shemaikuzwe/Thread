import {
  Home,
  MessageCircle,
  MoreHorizontal,
  Bell,
  PhoneIcon,
  type LucideProps,
} from "lucide-react";

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
import { Badge } from "./ui/badge";
interface Item {
  title: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  notifications?: number;
}
// Menu items
const items: Item[] = [
  {
    title: "Home",
    icon: Home,
  },
  {
    title: "DMs",
    icon: MessageCircle,
  },
  {
    title: "Calls",
    icon: PhoneIcon,
    notifications: 5,
  },
  {
    title: "Notifications",
    icon: Bell,
    notifications: 8,
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
        <img src={"/logo.png"} alt="Logo" className="h-12 w-30" />
      </SidebarHeader>
      <SidebarContent className="mt-10 w-[3rem]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex justify-center items-center w-full h-full flex-col gap-5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size={"lg"}
                    tooltip={item.title}
                    className="relative w-full"
                  >
                    {item.notifications && item.notifications > 0 && (
                      <Badge
                        className="absolute top-0 right-1 h-4 w-5 text-sm px-1.5"
                        variant="destructive"
                      >
                        {item.notifications}
                      </Badge>
                    )}
                    <item.icon className="w-full" />
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
