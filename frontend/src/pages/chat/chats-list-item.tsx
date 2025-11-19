import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ChatAvatar from "@/components/ui/user-avatar";
import { useChatMeta } from "@/hooks";
import {
  useMessages,
  useMessageStatus,
  // useUnReadMessages,
  type UnReadMessage,
} from "@/hooks/use-messages";
import type { ChatWithUsers } from "@/lib/types";
import { useNavigate } from "react-router";

export default function ChatListItem({
  chat,
  unReadMesssage,
}: {
  chat: ChatWithUsers;
  unReadMesssage: UnReadMessage | undefined;
}) {
  const navigate = useNavigate();
  const { data: messages } = useMessages(chat.id);
  const { data: msgStatus } = useMessageStatus(chat.id);
  const { name } = useChatMeta(chat);
  // const { data: un_read } = useUnReadMessages(chat.id, {
  //   last_read: unReadMesssage?.last_read ?? null,
  //   unread_count:
  //     (unReadMesssage?.unread_count && unReadMesssage.unread_count) ?? 0,
  // });
  // console.log("unread", unReadMesssage);
  return (
    <div>
      <div
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
        className="w-full flex items-center gap-3  rounded-md px-1.5 h-16 hover:bg-muted"
      >
        <div className="w-9">
          <ChatAvatar type="chat" chat={chat} />
        </div>
        <div className="flex flex-col gap-1 justify-center items-start w-full">
          <div className="flex justify-between w-full">
            <span className="font-medium">{name}</span>
            {/*{un_read && un_read.unread_count > 0 && (
              <Badge variant="destructive">{un_read.unread_count}</Badge>
            )}*/}
          </div>
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
