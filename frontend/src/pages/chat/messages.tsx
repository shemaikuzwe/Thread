import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyChat from "@/components/chat/empty-messages.tsx";
import { Meta } from "./message-meta";
import ChatAvatar from "@/components/ui/user-avatar";
import { FilePreview } from "@/components/chat/file-preview";
import { useOptimisticUnRead, type UnReadMessage } from "@/hooks/use-messages";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { useInView } from "react-intersection-observer";
import { useCallback, useEffect } from "react";

interface Props {
  chatId: string;
  handleOnMarkAsRead: () => void;
  ref: React.RefObject<HTMLDivElement | null>;
  messagesRef: React.RefObject<Message[] | undefined>;
  messages: Message[] | undefined;
  userId: string | undefined;
  chatType?: "dm" | "group";
}

export default function Messages({
  chatId,
  handleOnMarkAsRead,
  messages,
  userId,
  ref,
  chatType,
  messagesRef,
}: Props) {
  const getLastMessage = useCallback(() => {
    if (!userId) return;
    const messages = messagesRef.current;
    let lastMessageId: string | undefined;
    if (!messages || messages.length === 0) {
      return;
    }
    for (let i = messages.length - 1; i > 0; i--) {
      if (messages[i].user_id !== userId) {
        lastMessageId = messages[i].id;
        // console.log("last", messages[i].message);
        break;
      }
    }
    return lastMessageId;
  }, [userId, messagesRef]);

  const { ref: bottomRef, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 0px 0px",
  });

  const queryClient = useQueryClient();
  // const { data: unReadMessages } = useUnReadMessages(chatId);
  const { optimisticUnread, setOptimisticUnread } = useOptimisticUnRead(chatId);

  useEffect(() => {
    if (inView) {
      console.log("inview");
      handleOnMarkAsRead();
    }
  }, [inView, handleOnMarkAsRead]);

  useEffect(() => {
    return () => {
      setOptimisticUnread(null);
      const currentMessages = messagesRef.current;
      if (currentMessages && currentMessages.length > 0) {
        const lastMessage = getLastMessage();
        if (!lastMessage) return;
        queryClient.setQueryData(
          ["un_read_message", chatId],
          (oldData: UnReadMessage | undefined) => {
            if (oldData && oldData.unread_count > 0) {
              return { last_read: lastMessage, unread_count: 0 };
            }
            return oldData;
          },
        );
      }
    };
  }, [chatId, queryClient, getLastMessage, messagesRef, setOptimisticUnread]);

  return messages && messages.length > 0 ? (
    <div className="pb-4">
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

          const left = messages.length - idx;
          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                    {dateText}
                  </span>
                </div>
              )}
              {optimisticUnread &&
                optimisticUnread.unread_count > 0 &&
                left === optimisticUnread.unread_count &&
                message.user_id !== userId && (
                  <div className="relative my-4">
                    <hr className="border-t border-blue-500" />
                    <span className="font-bold absolute left-1/2 transform -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-blue-500">
                      {optimisticUnread.unread_count} unread messages
                    </span>
                  </div>
                )}
              <div
                id={message.id}
                className={cn(
                  "flex gap-2 p-1.5 w-full",
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
                        "rounded-md pl-2 pr-1 py-1 min-w-30 rounded-br-md",
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
            </div>
          );
        })}
        <div ref={bottomRef} className="h-[1px]"></div>
      </div>
    </div>
  ) : (
    <EmptyChat />
  );
}
