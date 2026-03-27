import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EmptyChatsList from "@/components/chat/empty-chats-list";
import { ChatListSkeleton } from "@/components/ui/chat-skeletons";
import SearchInput from "@/components/ui/search-input";
import { fetcher } from "@/lib/fetcher";
import type { ChatWithUsers } from "@/lib/types";
import ChatListItem from "./chats-list-item";
import NewChat from "./new-chat";

type UnreadResponse = {
  lastRead: string;
  threadId: string;
  unreadCount: number;
};

export default function ChatsList() {
  const [search, setSearch] = useState<string | null>(null);
  const { data: chats, isLoading } = useQuery<ChatWithUsers[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetcher(`/chats`, { method: "GET" });
      if (!res.ok) {
        throw new Error("Failed to fetch chats");
      }
      return await res.json();
    },
  });

  const { data: unReadChats } = useQuery<UnreadResponse[]>({
    queryKey: ["un_read"],
    queryFn: async () => {
      const res = await fetcher("/chats/unread", { method: "GET" });
      if (!res.ok) {
        throw new Error("failed to fetch unread message");
      }
      return await res.json();
    },
  });

  const filteredChats = search
    ? chats &&
      chats.filter(
        (chat) =>
          chat?.name?.toLowerCase().includes(search.toLowerCase()) ||
          (chat.type === "dm" &&
            chat.users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
              .length > 0),
      )
    : chats;

  const sortedChats = filteredChats?.sort(
    (a, b) =>
      new Date(b.lastMessage?.createdAt || b.createdAt).getTime() -
      new Date(a.lastMessage?.createdAt || a.createdAt).getTime(),
  );

  return (
    <div className="min-w-80 max-sm:w-full border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Chats</h2>
          <NewChat />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <SearchInput
          placeholder="Search"
          onSearch={(val) => {
            if (!val.trim()) {
              setSearch(null);
              return;
            }
            setSearch(val);
          }}
        />
        <div className="p-4">
          <div className="space-y-2">
            {isLoading ? (
              <ChatListSkeleton />
            ) : sortedChats && sortedChats.length > 0 ? (
              sortedChats.map((chat) => {
                const unReadChat = unReadChats?.find((c) => c.threadId === chat.id);
                return (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    unReadMessage={{
                      lastRead: unReadChat?.lastRead ?? null,
                      unreadCount: Number(unReadChat?.unreadCount ?? 0),
                    }}
                  />
                );
              })
            ) : (
              <EmptyChatsList />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
