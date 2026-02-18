"use client";

import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { Button, Input, ScrollArea, Avatar, AvatarFallback, AvatarImage } from "@thread/ui";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

interface Message {
  message: {
    id: string;
    message: string;
    createdAt: string;
    userId: string;
  };
  user: User;
}

interface WsMessage {
  type: string;
  threadId?: string;
  message?: string;
  userId?: string;
}

export function ChatView({ threadId, user }: { threadId: string; user: User }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages } = useQuery<Message[]>({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const { data } = await api.get(`/chats/${threadId}/messages`);
      return data;
    },
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMessage = (msg: WsMessage) => {
    if (msg.type === "MESSAGE" && msg.threadId === threadId && msg.message) {
      setMessages((prev) => [
        {
          message: {
            id: Date.now().toString(),
            message: msg.message!,
            createdAt: new Date().toISOString(),
            userId: msg.userId!,
          },
          user: user,
        },
        ...prev,
      ]);
    }
  };

  const { sendMessage } = useWebSocket(handleMessage);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({
      type: "MESSAGE",
      threadId,
      message: input,
    });
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="h-14 border-b flex items-center px-4">
        <h1 className="font-semibold">Chat</h1>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 flex flex-col-reverse">
          {messages.map((m) => (
            <div
              key={m.message.id}
              className={`flex gap-3 ${m.message.userId === user.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.user.profilePicture} />
                <AvatarFallback>{m.user.firstName[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] rounded-lg p-3 ${m.message.userId === user.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p>{m.message.message}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}
