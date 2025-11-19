import { useEffect } from "react";
import type { Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers/session-provider";
import { useWebSocket } from "./ws/websocket";
import type { UnReadMessage } from "./use-messages";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebsocket() {
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session?.user?.id;

  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(`${apiUrl}/ws`);
  if (!userId) throw new Error("user id is required");

  useEffect(() => {
    if (!message) return;

    if (
      message?.type === "USER_CONNECTED" ||
      message?.type === "USER_DISCONNECTED"
    ) {
      queryClient.setQueryData(["online", message.thread_id], {
        online: Number(message.message.online),
        users: message.message.users,
      });
    }

    if (message?.type === "MESSAGE") {
      queryClient.setQueryData(
        ["chat", message.thread_id],
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

      const isOwn = message.user_id === userId;
      queryClient.setQueryData(
        ["un_read_message", message.thread_id],
        (prev: UnReadMessage): UnReadMessage => ({
          ...prev,
          unread_count: isOwn ? 0 : (prev?.unread_count || 0) + 1,
        }),
      );
    }

    if (message.type === "MESSAGE_STATUS") {
      if (message.user_id === userId) return;
      queryClient.setQueryData(["msg-status", message.thread_id], {
        status: message.message,
      });
    }
  }, [message, queryClient, userId]);
  return { sendMessage: sendJsonMessage, readyState };
}
