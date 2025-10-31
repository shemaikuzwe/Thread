import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
export function Avatar() {
  return <Skeleton className="rounded-full w-10 h-10" />;
}
function ChatListItem() {
  return (
    <div>
      <div className="w-full flex items-center gap-3 px-3 py-2 my-2 rounded-lg text-left">
        <Avatar />
        <div className="flex flex-col gap-2 justify-center items-start">
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-30 h-3" />
        </div>
      </div>
    </div>
  );
}

function Message({ isOwn = true }: { isOwn?: boolean }) {
  return (
    <div
      className={cn("flex gap-3 p-2", isOwn ? "justify-end" : "justify-start")}
    >
      <Skeleton className="rounded-full w-8 h-8" />
      <Skeleton
        className={cn("w-30 h-14 mt-1 rounded-2xl", isOwn ? "order-first" : "")}
      />
      {/*<Skeleton className="h-3 w-25" />
        <div className="flex justify-end mt-1">
          <Skeleton className="h-2 w-15" />
        </div>*/}
    </div>
  );
}

export function ChatMessagesSkelton() {
  return (
    <div>
      <Message />
      <Message />
      <Message isOwn={false} />
      <Message isOwn={false} />
      <Message />
      <Message isOwn={false} />
    </div>
  );
}
export function ChatHeaderSkelton() {
  return (
    <div className="flex items-center gap-3">
      <Avatar />
      <div>
        <Skeleton className="w-30 h-4" />
      </div>
    </div>
  );
}

export function ChatListSkelton() {
  return (
    <div>
      <ChatListItem />
      <ChatListItem />
      <ChatListItem />
    </div>
  );
}
