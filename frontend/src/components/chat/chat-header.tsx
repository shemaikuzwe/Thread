import type { Chat, ChatWithUsers, User } from "@/lib/types";
import { Link, useParams } from "react-router";
import JoinButton from "./join-button.tsx";
import { useOnline } from "@/hooks/use-messages.ts";
import ThemeToggle from "../theme-toggle.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu.tsx";
import { ArrowLeft, EllipsisVerticalIcon, Video } from "lucide-react";
import { ChatHeaderSkelton } from "../ui/chat-skeltons.tsx";
import ChatAvatar from "../ui/user-avatar.tsx";
import { useChatMeta } from "@/hooks/index.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { Button } from "../ui/button.tsx";

interface Props {
  chat: ChatWithUsers | undefined;
  join: boolean;
  loading: boolean;
  setJoin: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChatHeader({ join, chat, loading, setJoin }: Props) {
  const isMobile = useIsMobile();
  const { id } = useParams();
  if (!id) throw new Error("Missing chat ID");
  const { data: online } = useOnline(id);
  const isOnline =
    chat?.type === "dm" &&
    online &&
    online.users.length === 2 &&
    online.users[0] !== online.users[1];
  const { name } = useChatMeta(chat);
  return (
    <div className="border-b cursor-pointer  px-6 py-2 flex justify-between">
      {isMobile && (
        <Button variant={"outline"} size={"icon"} asChild>
          <Link to={"/chat"}>
            <ArrowLeft />
          </Link>
        </Button>
      )}
      {loading ? (
        <ChatHeaderSkelton />
      ) : (
        chat && (
          <div className="flex items-center justify-between gap-3">
            <ChatAvatar type="chat" chat={chat} />
            <div>
              <h1 className="text-lg font-semibold capitalize">{name}</h1>
              <p className="text-sm text-gray-500">
                {isOnline
                  ? "online"
                  : online &&
                    chat.type === "group" &&
                    online.online > 1 &&
                    `${online.online} Online`}
              </p>
            </div>
          </div>
        )
      )}
      {join && chat && <JoinButton id={chat.id} setJoin={setJoin} />}

      <div className="flex gap-2">
        <Button asChild variant={"ghost"}>
          <Video className="h-12 w-15" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <EllipsisVerticalIcon className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="flex flex-col gap-2 bg-card p-2">
              <ThemeToggle />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
