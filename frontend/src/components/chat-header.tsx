import type { Channel, User } from "@/lib/types";
import { useParams } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import JoinButton from "./chat/join-button";

interface Props {
  chat: (Channel & { users: User[] }) | undefined;
  active: number | boolean;
  join: boolean;
  loading: boolean;
}

export default function ChatHeader({ active, join, chat, loading }: Props) {
  const { id } = useParams();

  if (!id) throw new Error("Missing chat ID");

  return (
    <div className="border-b  px-6 py-4 bg-muted/70 flex justify-between">
      {loading ? (
        <div>Loading ..</div>
      ) : (
        chat && (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={""} />
              <AvatarFallback>
                {chat?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 ">
                {chat?.name}
              </h1>
              <p className="text-sm text-gray-500">
                {typeof active === "number"
                  ? active > 0
                    ? `${active} online`
                    : ""
                  : active && "online"}
              </p>
            </div>
          </div>
        )
      )}
      {join && chat && <JoinButton id={chat.id} />}
    </div>
  );
}
