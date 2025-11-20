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

  if (!userId) throw new Error("user id is required");
  const {
    sendJsonMessage,
    lastJsonMessage: message,
    readyState,
  } = useWebSocket<Message>(`${apiUrl}/ws`);

  useEffect(() => {
    console.log("message", message);
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
      console.log("message handler");
      queryClient.setQueryData(
        ["chat", message.thread_id],
        (oldMsg: Message[] | undefined) => {
          console.log("inside message handler");
          const exists =
            oldMsg && oldMsg.length && oldMsg.some((m) => m.id === message.id);
          if (exists) {
            return oldMsg.map((m) =>
              m.id === message.id ? { ...m, status: "SENT" } : m,
            );
          }
          return [...(oldMsg ?? []), message];
        },
      );
      console.log("un read message handler");

      if (message.user_id !== userId) {
        queryClient.setQueryData(
          ["un_read_message", message.thread_id],
          (prev: UnReadMessage | undefined): UnReadMessage | undefined => {
            console.log("inside un_read message handler");
            if (!prev) return prev;
            return {
              ...prev,
              unread_count: (prev?.unread_count || 0) + 1,
            };
          },
        );
      }
      // else {
      //   queryClient.setQueryData(
      //     ["un_read_message", message.thread_id],
      //     (prev: UnReadMessage): UnReadMessage => ({
      //       ...prev,
      //       unread_count: 0,
      //     }),
      //   );
      // }
    }

    if (message.type === "MESSAGE_STATUS" && message.user_id !== userId) {
      console.log("message", message.message);
      queryClient.setQueryData(["msg-status", message.thread_id], {
        status: message.message,
      });
    }
  }, [message, queryClient, userId]);
  return { sendMessage: sendJsonMessage, readyState };
}
