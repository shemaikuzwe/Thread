import { useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/types";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const [message, setMessage] = useState<Message>();
  const wsRef = useRef<WebSocket | null>(null);
  const [active, setActive] = useState<Map<string, { active: number }>>(
    new Map(),
  );
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
        return setActive((prev) => {
          const newMap = new Map(prev); // create a copy
          newMap.set(msg.channel_id, { active: Number(msg.message) });
          return newMap; // return new reference
        });
      }
      setMessage(msg);
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = (msg: Message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open. Cannot send message.");
    }
  };

  return { message, sendMessage, active };
}
