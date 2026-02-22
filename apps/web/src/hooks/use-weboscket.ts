import { useEffect } from "react";
import type { ChatWithUsers, Message } from "@/lib/types";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useWebSocket } from "./ws/websocket";
import { type MessagesRes, type UnReadMessage } from "./use-messages";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

export function useWebsocket() {
  const queryClient = useQueryClient();
  const session = useSession();
  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(`${wsUrl}/ws`);
  const userId = session?.data?.user?.id;
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
        (
          oldData: InfiniteData<MessagesRes> | undefined,
        ): InfiniteData<MessagesRes> | undefined => {
          if (!oldData) return undefined;

          const exists = oldData.pages.some((page) =>
            page.messages.some((m) => m.id === message.id),
          );

          if (exists) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  m.id === message.id ? { ...m, status: "SENT" } : m,
                ),
              })),
            };
          }

          const newPages = [...oldData.pages];
          if (newPages.length > 0) {
            const lastPageIndex = newPages.length - 1;
            const lastPage = newPages[lastPageIndex];

            newPages[lastPageIndex] = {
              ...lastPage,
              messages: [...lastPage.messages, message],
              total: (lastPage.total || 0) + 1,
            };
          }

          return {
            ...oldData,
            pages: newPages,
          };
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
                    user_id: message.user_id,
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
