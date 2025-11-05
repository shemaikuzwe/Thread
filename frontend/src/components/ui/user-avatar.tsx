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
import { Link } from "react-router";
import defaultAvatar from "@/assets/default.png";
import type { Chat, ChatWithUsers, User } from "@/lib/types";
import { useChatMeta } from "@/hooks";
import { InfoIcon, MessageCircle } from "lucide-react";

interface Props {
  user?: User;
  type: "user" | "chat";
  showDropDown?: boolean;
  chat?: ChatWithUsers;
  showActive?: boolean;
}
export default function ChatAvatar({ user, type, showDropDown, chat }: Props) {
  if (type === "user" && user) {
    return <User user={user} showDropDown={showDropDown} />;
  }
  return type === "chat" && chat ? <Chat chat={chat} /> : null;
}

export function User({
  user,
  showDropDown,
}: {
  user: User;
  showDropDown?: boolean;
}) {
  const name = user.first_name + " " + user.last_name;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div>
          <Avatar className="rounded-full">
            <AvatarImage
              className="rounded-full"
              src={user?.profile_picture ?? defaultAvatar}
            />
            <AvatarFallback>
              {name?.split(" ").map((n) => n[0].toUpperCase()) ?? "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      {showDropDown && (
        <DropdownMenuContent>
          <DropdownMenuLabel>{`${user.first_name} ${user.last_name}`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={`/settings?tab=profile`}>
              <MessageCircle className="h-1 w-1" /> Message
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/settings?tab=settings`}>
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
      <Avatar className="rounded-full">
        <AvatarImage src={avatar ?? ""} />
        <AvatarFallback className="rounded-full">
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
