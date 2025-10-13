import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWebSocket } from "@/hooks/use-weboscket";
import type { Message } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import ChatHeader from "@/components/chat-header";
import EmptyChat from "@/components/empty-messages";
import { ArrowUp, Paperclip, SendHorizontalIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const { message, sendMessage } = useWebSocket();
  const [active, setActive] = useState(0);
  const session = useSession();
  const userId = session?.user?.id;
  if (!id) throw new Error("id is required");

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}/messages`);
      if (res.status !== 200) throw new Error("Failed to fetch messages");
      return res.data;
    },
  });

  const handleSendMessage = () => {
    if (!userId) throw new Error("message is required");
    if (newMessage.trim()) {
      const message: Message = {
        channel_id: id,
        id: crypto.randomUUID(),
        created_at: new Date().toUTCString(),
        message: newMessage,
        type: "MESSAGE",
        user_id: userId,
        from: {
          id: userId,
          email: session?.user?.email ?? "",
          first_name: session?.user?.first_name ?? "",
          last_name: session?.user?.last_name ?? "",
          profile_picture: session?.user?.profile_picture ?? "",
        },
      };
      sendMessage(message);
      setNewMessage("");
    }
  };
  useEffect(() => {
    if (message) {
      if (message.type === "MESSAGE") {
        // setMessages((prev) => [...prev, message]);
        console.log(message);
        queryClient.setQueryData(
          ["chat", message.channel_id],
          (oldMsg: Message[]) => {
            if (oldMsg && oldMsg.length) {
              return [...oldMsg, message];
            }
            return [message];
          },
        );
      }
      if (message.type == "USER_CONNECTED") {
        setActive(Number(message.message));
      }
      if (message.type === "USER_DISCONNECTED") {
        setActive(Number(message.message));
      }
    }
  }, [message, queryClient, id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <div className="h-screen bg-gray-50 flex w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader active={active} />

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div>Loading...</div>
          ) : messages && messages.length > 0 ? (
            messages.map((message) => {
              const isOwn = message.user_id === userId;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 p-2",
                    isOwn ? "justify-end" : "justify-start",
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={``} />
                    <AvatarFallback>
                      {"Shema Ikuzwe"
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md",
                      isOwn ? "order-first" : "",
                    )}
                  >
                    {/* {!message.isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                  </div>
                )} */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 min-w-30",
                        isOwn
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md",
                      )}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.message}
                      </p>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs">
                          {format(new Date(message.created_at), "H:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* {message.isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src="/abstract-geometric-shapes.png" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )} */}
                </div>
              );
            })
          ) : (
            <EmptyChat />
          )}
        </ScrollArea>
        <div className="w-full z-10">
          <div className="p-2">
            <div className="flex items-center gap-2 p-4 border border-border rounded-md focus-within:ring-2 focus-within:ring-ring/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 h-auto flex-shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <textarea
                value={newMessage ?? ""}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder="Send a message..."
                className="border-none px-2 outline-none focus:outline-none focus:ring-0 w-full resize-none"
                rows={2}
              />

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size={"icon"}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
