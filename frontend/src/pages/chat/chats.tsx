import EmptyChatsList from "@/components/empty-chats-list";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import type { Channel } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function ChatsList() {
  const navigate = useNavigate();
  const { data: chats, isLoading } = useQuery<Channel[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      if (res.status !== 200) {
        throw new Error("Failed to fetch chats");
      }
      return res.data;
    },
  });
  return (
    <div className="w-100 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Acme Inc</h2>
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                Loading...
              </div>
            ) : chats && chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-200"
                >
                  {/*<span className="text-lg">{chat.icon}</span>*/}
                  <span className="font-medium">{chat.name}</span>
                  {/*{chat.hasNotification && (
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                )}*/}
                </div>
              ))
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
