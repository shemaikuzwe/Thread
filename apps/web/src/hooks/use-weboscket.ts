import { useCallback, useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { token, useSession } from "@/lib/auth-client";
import type { ChatWithUsers, Message } from "@/lib/types";
import { useWebSocket } from "./ws/websocket";
import { type MessagesRes, type UnReadMessage } from "./use-messages";
export function useWebsocket() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const queryClient = useQueryClient();
  const session = useSession();

  const websocketUrl = useCallback(async () => {
    if (!wsUrl) {
      throw new Error("websocket url is not configured");
    }
    const { data, error } = await token();
    if (error) {
      throw new Error("failed to fetch auth token");
    }
    const params = new URLSearchParams();
    params.append("ws_token", data.token);
    return `${wsUrl}/v1/ws?${params.toString()}`;
  }, [wsUrl]);

  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(websocketUrl, {
    share: true,
    retryOnError: false,
    reconnectAttempts: 8,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    shouldReconnect: (event) => {
      return ![1008, 1011, 4001, 4003].includes(event.code);
    },
  });

  const userId = session?.data?.user?.id;

  useEffect(() => {
    if (!message) return;

    if (message.type === "USER_CONNECTED" || message.type === "USER_DISCONNECTED") {
      queryClient.setQueryData(["online", message.threadId], {
        online: Number((message.message as { online?: number })?.online ?? 0),
        users: (message.message as { users?: string[] })?.users ?? [],
      });
    }

    if (message.type === "MESSAGE") {
      queryClient.setQueryData(
        ["chat", message.threadId],
        (oldData: InfiniteData<MessagesRes> | undefined): InfiniteData<MessagesRes> | undefined => {
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

      queryClient.setQueryData(
        ["chats"],
        (prev: ChatWithUsers[] | undefined): ChatWithUsers[] | undefined => {
          if (!prev) return prev;
          return prev.map((thread) =>
            thread.id === message.threadId
              ? {
                  ...thread,
                  lastMessage: {
                    createdAt: message.createdAt,
                    id: message.id,
                    message: message.message,
                    userId: message.userId,
                  },
                }
              : thread,
          );
        },
      );

      const isOwn = message.userId === userId;
      queryClient.setQueryData(
        ["un_read_message", message.threadId],
        (prev: UnReadMessage | undefined): UnReadMessage | undefined => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadCount: isOwn ? 0 : (prev?.unreadCount || 0) + 1,
          };
        },
      );
    }

    if (message.type === "MESSAGE_STATUS" && message.userId !== userId) {
      queryClient.setQueryData(["msg-status", message.threadId], {
        status: message.message,
      });
    }
    if (message.type === "UPDATE_LAST_READ" && message.userId === userId) {
      queryClient.setQueryData(
        ["un_read_message", message.threadId],
        (prev: UnReadMessage | undefined): UnReadMessage | undefined => {
          if (!prev) return undefined;
          return { lastRead: String(message.message ?? ""), unreadCount: 0 };
        },
      );
    }
  }, [message, queryClient, userId]);

  return { sendMessage: sendJsonMessage, readyState };
}
