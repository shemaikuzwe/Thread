import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ChatAvatar from "@/components/ui/user-avatar";
import { useChatMeta } from "@/hooks";
import {
  useMessages,
  useMessageStatus,
  useUnReadMessages,
  type UnReadMessage,
} from "@/hooks/use-messages";
import type { ChatWithUsers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { usePathname, useRouter } from "next/navigation";

export default function ChatListItem({
  chat,
  unReadMessage,
}: {
  chat: ChatWithUsers;
  unReadMessage: UnReadMessage | undefined;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: msgStatus } = useMessageStatus(chat.id);
  const { data } = useMessages(chat.id);
  const { name } = useChatMeta(chat);
  const { data: unread } = useUnReadMessages(chat.id, {
    lastRead: unReadMessage?.lastRead ?? null,
    unreadCount: unReadMessage?.unreadCount ?? 0,
  });
  const lastMessage = data?.messages?.[data?.messages?.length - 1];
  const isActive = pathname.includes(chat.id);

  return (
    <div>
      <div
        onClick={() => {
          router.push(`/chat/${chat.id}`);
        }}
        className={cn(
          "w-full flex items-center gap-3 rounded-md px-1.5 h-16 hover:bg-muted",
          isActive && "bg-muted",
        )}
      >
        <div className="w-9">
          <ChatAvatar type="chat" chat={chat} />
        </div>
        <div className="flex flex-col gap-1 justify-center items-start w-full">
          <div className="flex justify-between w-full">
            <span className="font-medium capitalize">{name}</span>
            {unread && unread.unreadCount > 0 && (
              <Badge variant="destructive">{unread.unreadCount}</Badge>
            )}
          </div>
          {msgStatus?.status === "TYPING" ? (
            <span className="text-sm text-primary font-semibold">
              typing...
            </span>
          ) : (
            lastMessage && (
              <div className="flex justify-between w-full text-muted-foreground/90 text-sm">
                <span>{lastMessage.message}</span>
                <span>
                  {lastMessage.createdAt &&
                  isValid(new Date(lastMessage.createdAt))
                    ? format(new Date(lastMessage.createdAt), "HH:mm")
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
