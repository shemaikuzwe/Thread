import { useEffect } from "react";
import type { ChatWithUsers, Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers/session-provider";
import { useWebSocket } from "./ws/websocket";
import { type MessagesRes, type UnReadMessage } from "./use-messages";

const apiUrl = import.meta.env.VITE_API_URL;

export function useWebsocket() {
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session?.user?.id;

  if (!userId) throw new Error("user id is required");
  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(`${apiUrl}/ws`);

  useEffect(() => {
    if (!message) return;
    if (
      message.type === "USER_CONNECTED" ||
      message.type === "USER_DISCONNECTED"
    ) {
      queryClient.setQueryData(["online", message.thread_id], {
        online: Number(message.message.online),
        users: message.message.users,
      });
    }

    if (message.type === "MESSAGE") {
      queryClient.setQueryData(
        ["chat", message.thread_id],
        (oldMsg: MessagesRes | undefined): MessagesRes => {
          const exists =
            oldMsg &&
            oldMsg.messages.length &&
            oldMsg.messages.some((m) => m.id === message.id);
          if (exists) {
            return {
              total: oldMsg.total,
              messages: oldMsg.messages.map((m) =>
                m.id === message.id ? { ...m, status: "SENT" } : m,
              ),
            };
          }
          return { total: 1, messages: [...(oldMsg?.messages ?? []), message] };
        },
      );
      //Update last message in thread
      queryClient.setQueryData(
        ["chats"],
        (prev: ChatWithUsers[] | undefined): ChatWithUsers[] | undefined => {
          if (!prev) return prev;
          return prev.map((thread) =>
            thread.id === message.thread_id
              ? {
                  ...thread,
                  last_message: {
                    created_at: message.created_at,
                    id: message.id,
                    message: message.message,
                    user_id: userId,
                  },
                }
              : thread,
          );
        },
      );
      const isOwn = message.user_id === userId;
      queryClient.setQueryData(
        ["un_read_message", message.thread_id],
        (prev: UnReadMessage | undefined): UnReadMessage | undefined => {
          if (!prev) return prev;
          return {
            ...prev,
            unread_count: isOwn ? 0 : (prev?.unread_count || 0) + 1,
          };
        },
      );
    }
    if (message.type === "MESSAGE_STATUS" && message.user_id !== userId) {
      queryClient.setQueryData(["msg-status", message.thread_id], {
        status: message.message,
      });
    }
    if (message.type === "UPDATE_LAST_READ" && message.user_id === userId) {
      queryClient.setQueryData(
        ["un_read_message", message.thread_id],
        (prev: UnReadMessage | undefined): UnReadMessage | undefined => {
          if (!prev) return undefined;
          return { last_read: message.message, unread_count: 0 };
        },
      );
    }
  }, [message, queryClient, userId]);
  return { sendMessage: sendJsonMessage, readyState };
}
