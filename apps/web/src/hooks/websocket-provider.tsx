"use client";

import { createContext, useContext } from "react";
import { useWebsocket as useSocket } from "./use-weboscket";

type ChatWebsocketContextValue = ReturnType<typeof useSocket>;

const ChatWebsocketContext = createContext<ChatWebsocketContextValue | null>(null);

export function ChatWebsocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useSocket();
  return (
    <ChatWebsocketContext.Provider value={value}>
      {children}
    </ChatWebsocketContext.Provider>
  );
}

export function useWebsocket() {
  const context = useContext(ChatWebsocketContext);
  if (!context) {
    throw new Error("useChatWebsocket must be used within ChatWebsocketProvider");
  }
  return context;
}
