import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import EmptyChat from "@/components/chat/empty-messages.tsx";

interface Props {
  ref: React.RefObject<HTMLDivElement | null>;
  messages: Message[] | undefined;
  userId: string | undefined;
}

export default function Messages({ messages, userId, ref }: Props) {
  return messages && messages.length > 0 ? (
    <div className="pb-2" ref={ref}>
      {messages.map((message) => {
        const isOwn = message.user_id === userId;
        const fullName = message.from.first_name + " " + message.from.last_name;
        const existsMessageText = message.message.trim() !== "";
        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 p-2",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={``} />
              <AvatarFallback>
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn("max-w-xs lg:max-w-md", isOwn ? "order-first" : "")}
            >
              {message.files.length > 0 && (
                <div className="mb-2">
                  {message.files.map((file, index) => (
                    <div key={index} className="w-40 h-40 relative">
                      <img
                        src={file.url}
                        className="w-40 h-40 rounded-md"
                        alt={file.name}
                      />
                      {!existsMessageText && (
                        <Time
                          className="absolute bottom-1 right-1 text-white bg-black/50 rounded-md px-1"
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
                    "rounded-2xl px-3 py-2 min-w-30 rounded-br-md",
                    isOwn ? "bg-primary text-white" : "bg-secondary",
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <Time time={message.created_at} />
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

export function Time({
  time,
  className,
}: {
  time: Date | string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-end", className)}>
      <span className="text-xs">{format(new Date(time), "H:mm")}</span>
    </div>
  );
}
