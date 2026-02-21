"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MessageCircleIcon } from "lucide-react";
import ChatsList from "@/components/chat/chats-list";
import NewChat from "@/components/chat/new-chat";

export default function ChatIndexPage() {
  return (
    <div className="flex gap-2 justify-center w-full h-full">
      <ChatsList />
      <Empty className="max-sm:hidden">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleIcon />
          </EmptyMedia>
          <EmptyTitle>Open your chats</EmptyTitle>
          <EmptyDescription>Open chats to start a conversation.</EmptyDescription>
        </EmptyHeader>
        <NewChat>
          <Button variant="outline" size="sm">
            Create New Chat
          </Button>
        </NewChat>
      </Empty>
    </div>
  );
}
