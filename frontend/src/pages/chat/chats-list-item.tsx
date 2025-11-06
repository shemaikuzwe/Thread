import { Separator } from "@/components/ui/separator";
import ChatAvatar from "@/components/ui/user-avatar";
import { useChatMeta } from "@/hooks";
import { useMessages, useMessageStatus } from "@/hooks/use-messages";
import type { ChatWithUsers } from "@/lib/types";
import { useNavigate } from "react-router";

export default function ChatListItem({ chat }: { chat: ChatWithUsers }) {
  const navigate = useNavigate();
  const { data: messages } = useMessages(chat.id);
  const { data: msgStatus } = useMessageStatus(chat.id);
  const { name } = useChatMeta(chat);
  return (
    <div>
      <div
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
        className="w-full flex items-center gap-3 rounded-md px-1.5 h-16 hover:bg-muted"
      >
        <div className="w-9">
          <ChatAvatar type="chat" chat={chat} />
        </div>
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
