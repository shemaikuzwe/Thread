import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ChannelWithUsers } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import JoinButton from "./join-button";

export default function JoinChat({
  chat,
  setJoin,
}: {
  chat: ChannelWithUsers;
  setJoin: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="flex justify-center items-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Avatar>
              <AvatarImage src={""} />
              <AvatarFallback>
                {chat.name.slice(0, chat.name.length - 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </EmptyMedia>
          <EmptyTitle>Join Channel</EmptyTitle>
          <EmptyDescription>
            Join this channel to start chatting.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <JoinButton id={chat.id} setJoin={setJoin} />
        </EmptyContent>
      </Empty>
    </div>
  );
}
