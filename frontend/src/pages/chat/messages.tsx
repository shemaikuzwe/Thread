import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyChat from "@/components/chat/empty-messages.tsx";
import { Meta } from "./message-meta";
import ChatAvatar from "@/components/ui/user-avatar";
import { FilePreview } from "@/components/chat/file-preview";
import { useInView } from "react-intersection-observer";
import { useUnReadMessages, type UnReadMessage } from "@/hooks/use-messages";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-weboscket";

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
  });

  const queryClient = useQueryClient();
  const { data: unReadMesages } = useUnReadMessages(chatId);
  const { sendMessage } = useWebSocket();

  if (inView && messages && unReadMesages) {
    const lastMessage = messages[messages.length - 1].id;
    if (!unReadMesages.last_read || lastMessage !== unReadMesages.last_read) {
      queryClient.setQueryData(
        ["un_read_message", chatId],
        (): UnReadMessage => {
          return { last_read: lastMessage, unread_count: 0 };
        },
      );
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
  return messages && messages.length > 0 ? (
    <div className="pb-2" ref={messageRef}>
      <div ref={ref}>
        {messages.map((message) => {
          const isOwn = message.user_id === userId;
          const existsMessageText = message.message.trim() !== "";
          // const isSameUser =
          //   messages.length >= 2 &&
          //   messages[idx - 1]?.user_id === messages[idx]?.user_id;
          return (
            <>
              {unReadMesages &&
                unReadMesages.unread_count > 0 &&
                unReadMesages.last_read === message.id && (
                  <div className="mb-4 w-full flex justify-center items-center">
                    {unReadMesages.unread_count} unread messages
                  </div>
                )}
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 p-2 w-full",
                  isOwn ? "justify-end" : "justify-start",
                )}
              >
                <div className="w-8 h-8 flex-shrink-0">
                  <ChatAvatar
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
