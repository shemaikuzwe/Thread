import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyChat from "@/components/chat/empty-messages.tsx";
import { Meta } from "./message-meta";
import ChatAvatar from "@/components/ui/user-avatar";
import { FilePreview } from "@/components/chat/file-preview";

interface Props {
  ref: React.RefObject<HTMLDivElement | null>;
  messages: Message[] | undefined;
  userId: string | undefined;
  chatType?: "dm" | "group";
}

export default function Messages({ messages, userId, ref, chatType }: Props) {
  return messages && messages.length > 0 ? (
    <div className="pb-2" ref={ref}>
      {messages.map((message) => {
        const isOwn = message.user_id === userId;
        const existsMessageText = message.message.trim() !== "";
        // const isSameUser =
        //   messages.length >= 2 &&
        //   messages[idx - 1]?.user_id === messages[idx]?.user_id;
        return (
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
                    <div key={index} className="max-w-100 max-h-70 relative">
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
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <Meta
                    isOwn={isOwn}
                    status={message?.status}
                    time={message.created_at}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <EmptyChat />
  );
}
