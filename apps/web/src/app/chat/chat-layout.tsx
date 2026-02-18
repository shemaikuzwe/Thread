"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button, Avatar, AvatarFallback, AvatarImage, ScrollArea } from "@thread/ui";
import { logout } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

interface Thread {
  thread: {
    id: string;
    name: string | null;
    type: "group" | "dm";
  };
}

export function ChatLayout({ user }: { user: User }) {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const { data: threads } = useQuery<Thread[]>({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data } = await api.get("/chats");
      return data;
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/50 flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads?.map((t) => (
              <Link
                key={t.thread.id}
                href={`/chat/${t.thread.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {t.thread.name?.[0] || t.thread.type === "dm" ? "👤" : "#"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{t.thread.name || "Direct Message"}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-4xl mb-2">💬</p>
          <p>Select a chat to start messaging</p>
        </div>
      </main>
    </div>
  );
}
