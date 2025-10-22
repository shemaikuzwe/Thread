import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-weboscket";
import type { ChannelWithUsers, Message } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import ChatHeader from "@/components/chat-header";
import { ArrowUp, Paperclip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import JoinChat from "@/components/chat/join-chat";
import { useScroll } from "@/hooks/use-scroll";
import { AutoScroller } from "@/components/chat/auto-scroller";
import Messages from "./messages";
import ScrollAnchor from "./scroll-anchor";
import { useMessages } from "@/hooks/use-messages";

export default function ChatPage() {
  const { id } = useParams();
  const [join, setJoin] = useState(false);
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const { message, sendMessage, active } = useWebSocket();
  const session = useSession();
  const userId = session?.user?.id;
  if (!id) throw new Error("id is required");

  const { data: messages, isLoading } = useMessages(id);
  const { data: chat, isLoading: loading } = useQuery<ChannelWithUsers>({
    queryKey: ["chat-header", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      if (res.status !== 200) throw new Error("Failed to fetch chat");
      return res.data;
    },
  });

  useEffect(() => {
    if (chat && userId) {
      if (!chat.users.some((user) => user.id === userId)) {
        setJoin(true);
      }
    }
  }, [chat, userId]);

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

  const {
    isAtBottom,
    scrollToBottom,
    messagesRef,
    visibilityRef,
    handleScroll,
  } = useScroll<HTMLDivElement>();

  useEffect(() => {
    if (messages) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (message) {
      if (message.type === "MESSAGE") {
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
    }
  }, [message, queryClient, id]);
  return (
    <div className="gray-50 flex w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          active={active}
          join={join}
          setJoin={setJoin}
          loading={loading}
          chat={chat}
        />

        <ScrollArea
          onScrollCapture={handleScroll}
          className="flex-1 p-6 space-y-4 min-h-0"
        >
          <AutoScroller ref={visibilityRef}>
            {isLoading ? (
              <div>Loading...</div>
            ) : join && chat ? (
              <JoinChat chat={chat} setJoin={setJoin} />
            ) : (
              <Messages ref={messagesRef} messages={messages} userId={userId} />
            )}
          </AutoScroller>
        </ScrollArea>
        <div className="mx-auto flex justify-center items-center pb-2 pt-0 z-100">
          <ScrollAnchor
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
          />
        </div>
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
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSendMessage();
                  }
                }}
                placeholder="Send a message..."
                rows={1}
                className="border-none px-2 outline-none focus:outline-none focus:ring-0 w-full resize-none"
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
