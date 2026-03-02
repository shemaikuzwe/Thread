import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyChat from "@/components/chat/empty-messages";
import { Meta } from "./message-meta";
import ChatAvatar from "@/components/ui/user-avatar";
import { FilePreview } from "@/components/chat/file-preview";
import { type UnReadMessage } from "@/hooks/use-messages";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, isThisWeek, isValid } from "date-fns";
import { useCallback, useEffect } from "react";
import { AudioPlayer } from "@/components/ui/audio";

const safeFormat = (
  date: Date | string | number | undefined,
  formatStr: string,
) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (!isValid(parsed)) return "";
  return format(parsed, formatStr);
};

interface Props {
  chatId: string;
  ref: React.RefObject<HTMLDivElement | null>;
  messagesRef: React.RefObject<Message[] | undefined>;
  messages: Message[] | undefined;
  userId: string | undefined;
  chatType?: "dm" | "group";
  optimisticUnread: UnReadMessage | null;
  setOptimisticUnread: (val: UnReadMessage | null) => void;
}

export default function Messages({
  chatId,
  messages,
  userId,
  ref,
  chatType,
  messagesRef,
  optimisticUnread,
  setOptimisticUnread,
}: Props) {
  const getLastMessage = useCallback(() => {
    if (!userId) return;
    const currentMessages = messagesRef.current;
    let lastMessageId: string | undefined;

    if (!currentMessages || currentMessages.length === 0) {
      return;
    }

    for (let i = currentMessages.length - 1; i >= 0; i--) {
      const msg = currentMessages[i];
      if (msg && msg.userId !== userId) {
        lastMessageId = msg.id;
        break;
      }
    }

    return lastMessageId;
  }, [userId, messagesRef]);

  const queryClient = useQueryClient();

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
            if (oldData && oldData.unreadCount > 0) {
              return { lastRead: lastMessage, unreadCount: 0 };
            }
            return oldData;
          },
        );
      }
    };
  }, [chatId, queryClient, getLastMessage, messagesRef, setOptimisticUnread]);

  if (!messages || messages.length === 0) {
    return <EmptyChat />;
  }

  return (
    <div className="pb-4">
      <div ref={ref}>
        {messages.map((message, idx) => {
          if (!message) return null;

          const createdAt = new Date(message.createdAt);
          const isDateValid = isValid(createdAt);
          const currentDate = isDateValid
            ? format(createdAt, "yyyy-MM-dd")
            : "";
          const showDate =
            idx === 0 ||
            (isDateValid &&
              safeFormat(messages[idx - 1]?.createdAt, "yyyy-MM-dd") !==
                currentDate);

          let dateText = "";
          if (!isDateValid) {
            dateText = "";
          } else if (isToday(createdAt)) {
            dateText = "Today";
          } else if (isYesterday(createdAt)) {
            dateText = "Yesterday";
          } else if (isThisWeek(createdAt)) {
            dateText = format(createdAt, "EEEE");
          } else {
            dateText = format(createdAt, "MMMM d, yyyy");
          }

          const isOwn = message.userId === userId;
          const hasMessageText = message.message.trim() !== "";
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
                optimisticUnread.unreadCount > 0 &&
                left === optimisticUnread.unreadCount &&
                message.userId !== userId && (
                  <div className="relative my-4">
                    <hr className="border-t border-blue-500" />
                    <span className="font-bold absolute left-1/2 transform -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-blue-500">
                      {optimisticUnread.unreadCount} unread messages
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
                <div className="w-8 h-8 shrink-0">
                  {message.user && (
                    <ChatAvatar
                      showOnline={false}
                      type="user"
                      user={message.user}
                      showDropDown={!isOwn && chatType === "group"}
                    />
                  )}
                </div>

                <div className={cn("max-w-full", isOwn ? "order-first" : "")}>
                  {message.files.length > 0 && (
                    <div className="mb-2">
                      {message.files.map((file, index) => (
                        <div
                          key={index}
                          className="max-w-100 max-h-70 relative"
                        >
                          {file.type.startsWith("audio/") ? (
                            <AudioPlayer audioUrl={file.url} />
                          ) : (
                            <FilePreview file={file} message={message} />
                          )}
                          {!hasMessageText && (
                            <Meta
                              isOwn={isOwn}
                              status={message?.status}
                              className="absolute bottom-3 right-2 text-white bg-black/50 rounded-md px-1"
                              time={new Date(message.createdAt)}
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
                        time={new Date(message.createdAt)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
