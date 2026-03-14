import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { MessageCircleIcon } from "lucide-react";

export default function EmptyMessages() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleIcon />
        </EmptyMedia>
        <EmptyTitle>No chats messages!.</EmptyTitle>
        <EmptyDescription>Be the first to send a message.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
