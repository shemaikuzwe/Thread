import EmptyChatsList from "@/components/chat/empty-chats-list";
import { api } from "@/lib/axios";
import type { ChatWithUsers } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ChatListItem from "./chats-list-item";
import { ChatListSkelton } from "@/components/ui/chat-skeltons";
import NewChat from "./new-chat";
import SearchInput from "@/components/ui/search-input";

type Res = {
  last_read: string;
  thread_id: string;
  unread_count: string;
};

export default function ChatsList() {
  const [search, setSearch] = useState<string | null>(null);
  const { data: chats, isLoading } = useQuery<ChatWithUsers[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get(`/chats`);
      if (res.status !== 200) {
        throw new Error("Failed to fetch chats");
      }
      return res.data;
    },
  });

  const { data: unReadChats } = useQuery<Res[]>({
    queryKey: ["un_read"],
    queryFn: async () => {
      const res = await api.get("/chats/unread");
      if (res.status !== 200) {
        throw new Error("failed to fetch unread message");
      }
      return res.data;
    },
  });
  const filteredChats = search
    ? chats &&
      chats.filter(
        (chat) =>
          chat?.name?.toLowerCase().includes(search.toLowerCase()) ||
          (chat.type === "dm" &&
            chat.users.filter((user) =>
              user.name.toLowerCase().includes(search.toLowerCase()),
            ).length > 0),
      )
    : chats;

  const sortedChats = filteredChats?.sort(
    (a, b) =>
      new Date(b.last_message?.created_at || b.created_at).getTime() -
      new Date(a.last_message?.created_at || a.created_at).getTime(),
  );

  return (
    <div className="min-w-80 max-sm:w-full border-r border-border flex flex-col">
      {/* Header */}
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
              <ChatListSkelton />
            ) : sortedChats && sortedChats?.length > 0 ? (
              sortedChats.map((chat) => {
                const unReadChat = unReadChats?.find((c) => c.thread_id === chat.id);
                return (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    unReadMesssage={{
                      last_read: unReadChat?.last_read ?? null,
                      unread_count:
                        (unReadChat?.unread_count && Number(unReadChat.unread_count)) || 0,
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
