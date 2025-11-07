import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CreateChat } from "@/components/chat/create-chat.tsx";
import { MessageCircleIcon } from "lucide-react";
import ChatsList from "./chats-list";

export default function Index() {
  return (
    <div className="flex gap-2 justify-center w-full h-full">
      <ChatsList />
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleIcon />
          </EmptyMedia>
          <EmptyTitle>Open your chats</EmptyTitle>
          <EmptyDescription>
            Open chats to start a conversation.
          </EmptyDescription>
        </EmptyHeader>
        <CreateChat>
          <Button variant="outline" size="sm">
            Create New Chat
          </Button>
        </CreateChat>
      </Empty>
    </div>
  );
}
