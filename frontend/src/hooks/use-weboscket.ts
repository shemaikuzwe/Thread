import { useEffect } from "react";
import type { Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers/session-provider";
// import type { UnReadMessage } from "./use-messages";
import { useWebSocket } from "./ws/websocket";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebsocket() {
  // const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session?.user?.id;

  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(`${apiUrl}/ws`);
  if (!userId) throw new Error("user id is required");

  // const connect = useCallback(() => {
  //   if (wsRef.current?.readyState === WebSocket.OPEN) return;

  //   const socket = new WebSocket(`${apiUrl.replace(/^http/, "ws")}/ws`);
  //   wsRef.current = socket;

  useEffect(() => {
    if (!message) return;

    if (
      message?.type === "USER_CONNECTED" ||
      message?.type === "USER_DISCONNECTED"
    ) {
      queryClient.setQueryData(["online", message.channel_id], {
        online: Number(message.message.online),
        users: message.message.users,
      });
    }

    if (message?.type === "MESSAGE") {
      queryClient.setQueryData(
        ["chat", message.channel_id],
        (oldMsg: Message[] = []) => {
          const exists = oldMsg.some((m) => m.id === message.id);
          if (exists) {
            return oldMsg.map((m) =>
              m.id === message.id ? { ...m, status: "SENT" } : m,
            );
          }
          return [...oldMsg, message];
        },
      );

      // if (message.user_id !== userId) {
      //   queryClient.setQueryData(
      //     ["un_read_message", message.channel_id],
      //     (old: UnReadMessage): UnReadMessage => ({
      //       ...old,
      //       unread_count: old.unread_count + 1,
      //     }),
      //   );
      // }
    }

    if (message.type === "MESSAGE_STATUS") {
      if (message.user_id === userId) return;
      queryClient.setQueryData(["msg-status", message.channel_id], {
        status: message.message,
      });
    }
  }, [message, queryClient, userId]);

  // const disconnect = useCallback(() => {
  //   wsRef.current?.close();
  //   wsRef.current = null;
  // }, []);

  // const sendMessage = useCallback(<T>(msg: T) => {
  //   if (wsRef.current?.readyState === WebSocket.OPEN) {
  //     wsRef.current.send(JSON.stringify(msg));
  //   } else {
  //     console.warn("WebSocket not open");
  //   }
  // }, []);

  return { sendMessage: sendJsonMessage, readyState };
}
