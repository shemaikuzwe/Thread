"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useWebSocket } from "@/hooks/use-weboscket";
import type { Message } from "@/lib/types";

interface Channel {
  id: string;
  name: string;
  type: "text" | "announcement" | "design" | "mobile";
  icon: string;
  hasNotification?: boolean;
}

interface DirectMessage {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
}

const channels: Channel[] = [
  { id: "1", name: "general", type: "text", icon: "#", hasNotification: true },
  { id: "2", name: "random", type: "text", icon: "#" },
  { id: "3", name: "announcements", type: "announcement", icon: "📢" },
  { id: "4", name: "design", type: "design", icon: "✏️" },
  { id: "5", name: "mobile", type: "mobile", icon: "📱" },
];

const directMessages: DirectMessage[] = [
  { id: "1", name: "John Doe", avatar: "/thoughtful-man.png", isOnline: true },
  { id: "2", name: "Jane Smith", avatar: "/diverse-woman-portrait.png" },
  { id: "3", name: "Peter Parker", avatar: "/young-man.jpg" },
  { id: "4", name: "Emily Davis", avatar: "/woman-brown-hair.jpg" },
];

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("1");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { message, sendMessage } = useWebSocket();

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        date: new Date().toUTCString(),
        message: newMessage,
        type: "MESSAGE",
      };
      setMessages([...messages, message]);
      setNewMessage("");
      sendMessage(newMessage);
    }
  };
  useEffect(() => {
    if (message) {
      if (message.type === "MESSAGE") {
        setMessages([...messages, message]);
      }
    }
  }, [message]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentChannelName = selectedDM
    ? directMessages.find((dm) => dm.id === selectedDM)?.name
    : channels.find((ch) => ch.id === selectedChannel)?.name;

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Logo />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Channels</h2>
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannel(channel.id);
                    setSelectedDM(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedChannel === channel.id && !selectedDM
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{channel.icon}</span>
                  <span className="font-medium">{channel.name}</span>
                  {channel.hasNotification && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                  )}
                </button>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {selectedDM ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={
                      directMessages.find((dm) => dm.id === selectedDM)
                        ?.avatar || "/placeholder.svg"
                    }
                  />
                  <AvatarFallback>
                    {directMessages
                      .find((dm) => dm.id === selectedDM)
                      ?.name.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentChannelName}
                  </h1>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-lg">
                  {channels.find((ch) => ch.id === selectedChannel)?.icon}
                </span>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    #{currentChannelName}
                  </h1>
                  <p className="text-sm text-gray-500">12 members</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 
                // message.isOwn ? "justify-end" : "justify-start"
              `}
            >
              {/* {!message.isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage
                    src={`/abstract-geometric-shapes.png?height=32&width=32&query=${message.sender
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  />
                  <AvatarFallback>
                    {message.sender
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )} */}
              <div
              // className={`max-w-xs lg:max-w-md
              //   // message.isOwn ? "order-first" : ""
              // `}
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
                // className={`rounded-2xl px-4 py-3 ${
                //   message.isOwn
                //     ? "bg-primary text-white rounded-br-md"
                //     : "bg-gray-100 text-gray-900 rounded-bl-md"
                // }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                </div>
                {/* {message.isOwn && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                  </div>
                )} */}
              </div>
              {/* {message.isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src="/abstract-geometric-shapes.png" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )} */}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleKeyPress}
                placeholder={`Message ${
                  selectedDM ? currentChannelName : `#${currentChannelName}`
                }`}
                className="resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="text-white px-4 py-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
