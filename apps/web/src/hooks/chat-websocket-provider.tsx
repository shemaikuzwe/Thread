"use client";

import { createContext, useContext } from "react";
import { useWebsocket } from "./use-weboscket";

type ChatWebsocketContextValue = ReturnType<typeof useWebsocket>;

const ChatWebsocketContext = createContext<ChatWebsocketContextValue | null>(null);

export function ChatWebsocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useWebsocket();
  return (
    <ChatWebsocketContext.Provider value={value}>
      {children}
    </ChatWebsocketContext.Provider>
  );
}

export function useChatWebsocket() {
  const context = useContext(ChatWebsocketContext);
  if (!context) {
    throw new Error("useChatWebsocket must be used within ChatWebsocketProvider");
  }
  return context;
}
