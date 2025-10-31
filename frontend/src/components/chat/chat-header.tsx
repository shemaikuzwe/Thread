import type { Chat, User } from "@/lib/types";
import { useParams } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.tsx";
import JoinButton from "./join-button.tsx";
import { useOnline } from "@/hooks/use-messages.ts";
import ThemeToggle from "../theme-toggle.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { EllipsisVerticalIcon } from "lucide-react";
import { ChatHeaderSkelton } from "../ui/chat-skeltons.tsx";
import { useChatName } from "@/hooks";

interface Props {
  chat: (Chat & { users: User[] }) | undefined;
  join: boolean;
  loading: boolean;
  setJoin: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChatHeader({ join, chat, loading, setJoin }: Props) {
  const { id } = useParams();
  if (!id) throw new Error("Missing chat ID");
  const { data: online } = useOnline(id);
  const { name } = useChatName(chat);
  const isOnline = chat?.type === "dm" && online && online.users.length === 2;
  return (
    <div className="border-b cursor-pointer  px-6 py-4 flex justify-between">
      {loading ? (
        <ChatHeaderSkelton />
      ) : (
        chat && (
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="text-lg font-semibold ">{name}</h1>
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
  );
}
