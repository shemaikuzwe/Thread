import {
  Home,
  MessageCircle,
  MoreHorizontal,
  Bell,
  type LucideProps,
  Presentation,
  Video,
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
import Link from "next/link";
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
    icon: Video,
    notifications: 5,
  },
  {
    title: "Notifications",
    icon: Bell,
    notifications: 15,
  },
  {
    title: "More",
    icon: MoreHorizontal,
  },
];

export function ChatSidebar() {
  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <img src={"/logo.png"} alt="Logo" className="h-12 w-30" />
      </SidebarHeader>
      <SidebarContent className="mt-10 w-full">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="max-w-full flex justify-center items-center w-full h-full flex-col gap-5">
              {items.map((item, idx) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={idx == 0}
                    tooltip={item.title}
                    className="relative w-full"
                    asChild
                  >
                    <Link href={"/chat"}>
                      {item.notifications && item.notifications > 0 && (
                        <Badge
                          className="absolute  top-0 right-1 h-4 text-xs px-1"
                          variant="destructive"
                        >
                          {item.notifications}
                        </Badge>
                      )}
                      <item.icon className="h-full w-full" />
                    </Link>
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
