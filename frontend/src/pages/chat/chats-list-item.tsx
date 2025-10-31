import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useChatName } from "@/hooks";
import { useMessages, useMessageStatus } from "@/hooks/use-messages";
import type { ChatWithUsers } from "@/lib/types";
import { useNavigate } from "react-router";

export default function ChatListItem({ chat }: { chat: ChatWithUsers }) {
  const navigate = useNavigate();
  const { data: messages } = useMessages(chat.id);
  const { data: msgStatus } = useMessageStatus(chat.id);
  const { name } = useChatName(chat);
  return (
    <div>
      <div
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
        className="w-full flex items-center gap-3 px-3 py-2 my-2 rounded-lg text-left hover:bg-muted"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={""} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 justify-center items-start">
          <span className="font-medium">{name}</span>
          {msgStatus?.status === "TYPING" ? (
            <span className="text-sm text-primary font-semibold">
              typing...
            </span>
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
