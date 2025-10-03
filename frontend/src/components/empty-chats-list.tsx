import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "./ui/button";
import { MessageCircleIcon } from "lucide-react";
import { CreateChat } from "./create-chat";

export default function EmptyChatsList() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleIcon />
        </EmptyMedia>
        <EmptyTitle>No chats yet!.</EmptyTitle>
        <EmptyDescription>Create a new chat to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateChat>
          <Button variant="outline" size="sm">
            Create New Chat
          </Button>
        </CreateChat>
      </EmptyContent>
    </Empty>
  );
}
