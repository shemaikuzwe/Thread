import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ChatAvatar from "@/components/ui/user-avatar";
import { useChatMeta } from "@/hooks";
import { useMessageStatus, useUnReadMessages, type UnReadMessage } from "@/hooks/use-messages";
import type { ChatWithUsers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { useLocation, useNavigate } from "react-router";

export default function ChatListItem({
  chat,
  unReadMesssage,
}: {
  chat: ChatWithUsers;
  unReadMesssage: UnReadMessage | undefined;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: msgStatus } = useMessageStatus(chat.id);
  const { name } = useChatMeta(chat);
  const { data: un_read } = useUnReadMessages(chat.id, {
    last_read: unReadMesssage?.last_read ?? null,
    unread_count: (unReadMesssage?.unread_count && unReadMesssage.unread_count) ?? 0,
  });
  const isActive = !!pathname.includes(chat.id);
  return (
    <div>
      <div
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
        className={cn(
          "w-full flex items-center gap-3  rounded-md px-1.5 h-16 hover:bg-muted",
          isActive && "bg-muted",
        )}
      >
        <div className="w-9">
          <ChatAvatar type="chat" chat={chat} />
        </div>
        <div className="flex flex-col gap-1 justify-center items-start w-full">
          <div className="flex justify-between w-full">
            <span className="font-medium capitalize">{name}</span>
            {un_read && un_read.unread_count > 0 && (
              <Badge variant="destructive">{un_read.unread_count}</Badge>
            )}
          </div>
          {msgStatus?.status === "TYPING" ? (
            <span className="text-sm text-primary font-semibold">typing...</span>
          ) : (
            chat.last_message && (
              <div className="flex justify-between w-full text-muted-foreground/90 text-sm">
                <span>{chat.last_message.message}</span>
                <span>
                  {chat.last_message.created_at && isValid(new Date(chat.last_message.created_at))
                    ? format(new Date(chat.last_message.created_at), "HH:mm")
                    : ""}
                </span>
              </div>
            )
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
}
