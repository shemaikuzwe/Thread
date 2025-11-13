import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyChat from "@/components/chat/empty-messages.tsx";
import { Meta } from "./message-meta";
import ChatAvatar from "@/components/ui/user-avatar";
import { FilePreview } from "@/components/chat/file-preview";
import { useUnReadMessages, type UnReadMessage } from "@/hooks/use-messages";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-weboscket";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useRef } from "react";

interface Props {
  chatId: string;
  ref: React.RefObject<HTMLDivElement | null>;
  messages: Message[] | undefined;
  userId: string | undefined;
  chatType?: "dm" | "group";
}

export default function Messages({
  chatId,
  messages,
  userId,
  ref,
  chatType,
}: Props) {
  const { ref: messageRef, inView } = useInView({
    delay: 100,
    threshold: 0.9,
    rootMargin: "0px 0px 0px 0px",
  });
  const queryClient = useQueryClient();
  const { data: unReadMesages } = useUnReadMessages(chatId);
  const { sendMessage } = useWebSocket();
  const unReadRef = useRef<UnReadMessage | null>(null);
  console.log("red", unReadRef.current);
  console.log(unReadMesages);
  const handleRead = useCallback(() => {
    if (messages && messages.length > 0 && unReadMesages) {
      const lastMessage = messages[messages.length - 1].id;
      if (!unReadMesages.last_read || lastMessage !== unReadMesages.last_read) {
        // if (unReadRef.current) {
        //   unReadRef.current.last_read = lastMessage;
        //   unReadRef.current.unread_count = 0;
        // }
        const msg = {
          message: lastMessage,
          channel_id: chatId,
          user_id: userId,
          date: new Date().toISOString(),
          type: "UPDATE_LAST_READ",
        };
        sendMessage(msg);
      }
    }
  }, [chatId, sendMessage, unReadMesages, userId, messages]);
  useEffect(() => {
    if (!inView) {
      handleRead();
      // console.log("should have updated");
    }
  }, [inView, handleRead]);
  useEffect(() => {
    return () => {
      if (!messages || messages.length < 0) return;
      console.log("running on unMount");
      const lastMessage = messages[messages.length - 1].id;
      if (unReadRef.current) {
        unReadRef.current.last_read = unReadMesages?.last_read ?? null;
        unReadRef.current.unread_count = unReadMesages?.unread_count ?? 0;
      }
      queryClient.setQueryData(
        ["un_read_message", chatId],
        (): UnReadMessage => {
          return { last_read: lastMessage, unread_count: 0 };
        },
      );
    };
  }, [chatId, queryClient, messages]);

  return messages && messages.length > 0 ? (
    <div className="pb-2" ref={messageRef}>
      <div ref={ref}>
        {messages.map((message, idx) => {
          const currentDate = format(message.created_at, "yyyy-MM-dd");
          const showDate =
            idx === 0 ||
            format(messages[idx - 1].created_at, "yyyy-MM-dd") !== currentDate;
          let dateText = "";
          if (isToday(message.created_at)) dateText = "Today";
          else if (isYesterday(message.created_at)) dateText = "Yesterday";
          else if (isThisWeek(message.created_at))
            dateText = format(message.created_at, "EEEE");
          else dateText = format(message.created_at, "MMMM d, yyyy");
          const isOwn = message.user_id === userId;
          const existsMessageText = message.message.trim() !== "";
          return (
            <>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                    {dateText}
                  </span>
                </div>
              )}
              {unReadRef.current &&
                unReadRef.current.unread_count > 0 &&
                unReadRef.current.last_read === message.id && (
                  <div className="relative my-4">
                    <hr className="border-t border-blue-500" />
                    <span className="font-bold absolute left-1/2 transform -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-blue-500">
                      {unReadRef.current.unread_count} unread messages
                    </span>
                  </div>
                )}
              <div
                key={message.id}
                id={message.id}
                className={cn(
                  "flex gap-3 p-2 w-full",
                  isOwn ? "justify-end" : "justify-start",
                )}
              >
                <div className="w-8 h-8 flex-shrink-0">
                  <ChatAvatar
                    showOnline={false}
                    type="user"
                    user={message.from}
                    showDropDown={!isOwn && chatType === "group"}
                  />
                </div>

                <div className={cn("max-w-full", isOwn ? "order-first" : "")}>
                  {message.files.length > 0 && (
                    <div className="mb-2">
                      {message.files.map((file, index) => (
                        <div
                          key={index}
                          className="max-w-100 max-h-70 relative"
                        >
                          <FilePreview file={file} message={message} />
                          {!existsMessageText && (
                            <Meta
                              isOwn={isOwn}
                              status={message?.status}
                              className="absolute bottom-3 right-2 text-white bg-black/50 rounded-md px-1"
                              time={message.created_at}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {message.message.trim() && (
                    <div
                      className={cn(
                        "rounded-md pl-2 pr-1 py-2 min-w-30 rounded-br-md",
                        isOwn ? "bg-primary text-white" : "bg-secondary",
                      )}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.message}
                      </p>
                      <Meta
                        isOwn={isOwn}
                        status={message?.status}
                        time={message.created_at}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })}
      </div>
    </div>
  ) : (
    <EmptyChat />
  );
}
