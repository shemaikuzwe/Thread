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
        // console.log("fullName", fullName);
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
              {/* {!message.isOwn && (
         <div className="flex items-center gap-2 mb-1">
           <span className="text-sm font-medium text-gray-900">
             {message.sender}
           </span>
           <span className="text-xs text-gray-500">
             {message.timestamp}
           </span>
         </div>
       )} */}
              {/*{message.files.length > 0 && (
                <div>
                  {message.files.map((file) => (
                    <div className="w-40 h-40">
                      <img src={file.url} className="w-40 h-40" />
                    </div>
                  ))}
                </div>
              )}
*/}
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 min-w-30 rounded-br-md",
                  isOwn ? "bg-primary text-white" : "bg-secondary",
                )}
              >
                <p className="text-sm leading-relaxed">{message.message}</p>
                <div className="flex justify-end">
                  <span className="text-xs">
                    {format(new Date(message.created_at), "H:mm")}
                  </span>
                </div>
              </div>
            </div>
            {/* {message.isOwn && (
       <Avatar className="w-8 h-8 flex-shrink-0">
         <AvatarImage src="/abstract-geometric-shapes.png" />
         <AvatarFallback>You</AvatarFallback>
       </Avatar>
     )} */}
          </div>
        );
      })}
    </div>
  ) : (
    <EmptyChat />
  );
}
