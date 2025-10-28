import Search from "@/components/chat/search";
import EmptyChatsList from "@/components/empty-chats-list";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import type { ChannelWithUsers } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ChatListItem from "./chats-list-item";
import { ChatListSkelton } from "@/components/ui/chat-skeltons";

export default function ChatsList() {
  const [search, setSearch] = useState<string>();
  const { data: chats, isLoading } = useQuery<ChannelWithUsers[]>({
    queryKey: ["chats", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search && search.trim()) {
        params.set("search", search);
      }
      const res = await api.get(`/chats?${params.toString()}`);
      if (res.status !== 200) {
        throw new Error("Failed to fetch chats");
      }
      return res.data;
    },
  });

  return (
    <div className="min-w-80  border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Instant</h2>
          <Button variant="ghost" size="sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto py-3">
        <Search onSearch={setSearch} />
        <div className="p-4">
          <div className="space-y-2">
            {isLoading ? (
              <ChatListSkelton />
            ) : chats && chats.length > 0 ? (
              chats.map((chat) => <ChatListItem key={chat.id} chat={chat} />)
            ) : (
              <EmptyChatsList />
            )}
          </div>

          {/*<h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
            Direct Messages
          </h3>
          <div className="space-y-2">
            {directMessages.map((dm) => (
              <button
                key={dm.id}
                onClick={() => {
                  setSelectedDM(dm.id);
                  setSelectedChannel("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedDM === dm.id
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={dm.avatar || "/placeholder.svg"}
                      alt={dm.name}
                    />
                    <AvatarFallback>
                      {dm.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {dm.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                  )}
                </div>
                <span className="font-medium">{dm.name}</span>
              </button>
            ))}
          </div>*/}
        </div>
      </div>
    </div>
  );
}
