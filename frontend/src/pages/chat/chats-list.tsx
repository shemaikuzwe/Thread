import Search from "@/components/chat/search";
import EmptyChatsList from "@/components/chat/empty-chats-list.tsx";
import { api } from "@/lib/axios";
import type { ChatWithUsers } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ChatListItem from "./chats-list-item";
import { ChatListSkelton } from "@/components/ui/chat-skeltons";
import NewChat from "./new-chat";

export default function ChatsList() {
  const [search, setSearch] = useState<string>();
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
  type Res = {
    last_read: string;
    channel_id: string;
    unread_count: string;
  };
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
            chat.users.filter(
              (user) =>
                user.first_name.toLowerCase().includes(search.toLowerCase()) ||
                user.last_name.toLowerCase().includes(search.toLowerCase()),
            ).length > 0),
      )
    : chats;

  return (
    <div className="min-w-80 max-sm:w-full border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Thread</h2>
          <NewChat />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <Search onSearch={setSearch} />
        <div className="p-4">
          <div className="space-y-2">
            {isLoading ? (
              <ChatListSkelton />
            ) : filteredChats && filteredChats?.length > 0 ? (
              filteredChats.map((chat) => {
                const unReadChat = unReadChats?.find(
                  (c) => c.channel_id === chat.id,
                );
                return (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    unReadMesssage={{
                      last_read: unReadChat?.last_read ?? null,
                      unread_count:
                        (unReadChat?.unread_count &&
                          Number(unReadChat.unread_count)) ||
                        0,
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
