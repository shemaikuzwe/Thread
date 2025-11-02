import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers/session-provider";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("user id is required");
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
        queryClient.setQueryData(["online", msg.channel_id], () => {
          return {
            active: Number(msg.message.active),
            users: msg.message.users,
          };
        });
      }
      if (msg.type === "MESSAGE") {
        queryClient.setQueryData(
          ["chat", msg.channel_id],
          (oldMsg: Message[]) => {
            if (oldMsg && oldMsg.length) {
              return [...oldMsg, msg];
            }
            return [msg];
          },
        );
      }
      if (msg.type === "MESSAGE_STATUS") {
        if (msg.user_id === userId) return;
        queryClient.setQueryData(["msg-status", msg.channel_id], () => {
          return { status: msg.message };
        });
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => {
      socket.close();
    };
  }, [queryClient, userId]);

  const sendMessage = <T>(msg: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("sending msg", msg);
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open. Cannot send message.");
    }
  };

  return { sendMessage };
}
