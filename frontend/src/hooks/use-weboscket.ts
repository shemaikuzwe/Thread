import { useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const [message, setMessage] = useState<Message>();
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = new WebSocket(`${apiUrl.replace(/^http/, "ws")}/ws`);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Message;
      console.log(msg);
      if (msg.type === "USER_CONNECTED" || msg.type === "USER_DISCONNECTED") {
        queryClient.setQueryData(["active", msg.channel_id], () =>
          Number(msg.message),
        );
      }
      setMessage(msg);
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  const sendMessage = (msg: Message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open. Cannot send message.");
    }
  };

  return { message, sendMessage };
}
