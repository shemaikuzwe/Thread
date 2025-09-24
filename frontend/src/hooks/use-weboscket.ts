import type { Message } from "@/lib/types";
import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL;
const ws = new WebSocket(`${apiUrl}/ws`);
function useWebSocket() {
  const [message, setMessage] = useState<Message>();
  ws.onopen = () => {
    console.log("Websocket connected");
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Message;
      setMessage(msg);
    };
  };
  ws.onerror = (e) => {
    console.log("Something went wrong on our end", e);
  };
  const sendMessage = (msg: string) => {
    const message: Message = {
      date: new Date().toUTCString(),
      id: crypto.randomUUID(),
      message: msg,
      type: "MESSAGE",
    };
    if (ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  return { message, sendMessage };
}

export { useWebSocket };
