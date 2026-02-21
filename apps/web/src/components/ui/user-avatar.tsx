import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { AvatarImage } from "./avatar";
import Link from "next/link";
const defaultAvatar = "/default.png";
import type { Chat, ChatWithUsers, User } from "@/lib/types";
import { useChatMeta } from "@/hooks";
import { InfoIcon, MessageCircle } from "lucide-react";

interface Props {
  user?: User;
  type: "user" | "chat";
  showDropDown?: boolean;
  chat?: ChatWithUsers;
  showOnline?: boolean;
}
export default function ChatAvatar({ user, type, showDropDown, chat, showOnline }: Props) {
  if (type === "user" && user) {
    return <User showOnline={showOnline} user={user} showDropDown={showDropDown} />;
  }
  return type === "chat" && chat ? <Chat chat={chat} /> : null;
}

export function User({
  user,
  showDropDown,
  showOnline,
}: {
  user: User;
  showDropDown?: boolean;
  showOnline?: boolean;
}) {
  const name = user.first_name + " " + user.last_name;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative">
          <Avatar className="rounded-full">
            <AvatarImage className="rounded-full" src={user?.profile_picture ?? defaultAvatar} />
            <AvatarFallback>
              {name?.split(" ").map((n) => n[0]?.toUpperCase()) ?? "U"}
            </AvatarFallback>
          </Avatar>
          {showOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
          )}
        </div>
      </DropdownMenuTrigger>
      {showDropDown && (
        <DropdownMenuContent>
          <DropdownMenuLabel>{`${user.first_name} ${user.last_name}`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={"#"}>
              <MessageCircle className="h-1 w-1" /> Message
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`#`}>
              <InfoIcon className="h-1 w-1" /> Info
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
export function Chat({ chat }: { chat: ChatWithUsers }) {
  const { name, avatar } = useChatMeta(chat);
  return (
    <div>
      <Avatar className="rounded-full w-8 h-8">
        <AvatarImage src={avatar ?? ""} className="rounded-full w-8 h-8" />
        <AvatarFallback className="rounded-full w-8 h-8">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
