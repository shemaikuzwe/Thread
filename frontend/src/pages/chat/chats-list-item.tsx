import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useMessages, useMessageStatus } from "@/hooks/use-messages";
import type { Channel } from "@/lib/types";
import { useNavigate } from "react-router";

export default function ChatListItem({ chat }: { chat: Channel }) {
  const navigate = useNavigate();
  const { data: messages } = useMessages(chat.id);
  const { data: msgStatus } = useMessageStatus(chat.id);
  return (
    <div>
      <div
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
        className="w-full flex items-center gap-3 px-3 py-2 my-2 rounded-lg text-left hover:bg-gray-200"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={""} />
          <AvatarFallback>
            {chat?.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 justify-center items-start">
          <span className="font-medium">{chat.name}</span>
          {msgStatus?.status === "TYPING" ? (
            <span>Typing...</span>
          ) : messages && messages.length > 0 ? (
            <span className="text-muted-foreground/90 text-sm">
              {messages[messages.length - 1].message}
            </span>
          ) : null}
        </div>
      </div>
      <Separator />
    </div>
  );
}
