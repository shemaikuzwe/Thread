import { CreateThread } from "@/components/chat/create-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatListSkeleton } from "@/components/ui/chat-skeletons";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchInput from "@/components/ui/search-input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, PenBoxIcon, UserPlus, Users } from "lucide-react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: string;
  name: string;
  type: "group" | "user";
};

const chatTypes = [
  {
    text: "New Thread",
    type: "group",
    icon: Users,
  },
  {
    text: "Add friend",
    type: "dm",
    icon: UserPlus,
  },
];

export default function NewChat({ children }: { children?: React.ReactNode }) {
  const [search, setSearch] = useState<string>();
  const [open, setOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery<Result[]>({
    queryKey: ["new-chat", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      const res = await api.get(`/chats?${params.toString()}`);
      if (!res.data) {
        return null;
      }
      return res.data;
    },
    enabled: !!search,
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="ghost">
            <span className="sr-only">New</span>
            <PenBoxIcon className="h-10 w-10" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-150 min-h-80 flex flex-col gap-2">
        <SearchInput
          disabled={isOpen}
          placeholder="Search new user,thread"
          onSearch={(value) => setSearch(value)}
        />
        <ScrollArea className="flex flex-col h-full w-full justify-start items-start">
          {isOpen && (
            <CreateThread
              onClose={() => {
                setIsOpen(false);
                setOpen(false);
              }}
              className="mx-4"
            />
          )}
          {isLoading && <ChatListSkeleton />}
          {data && data.length > 0
            ? data.map((item) => (
                <SearchItem key={item.id} item={item} setSearch={setSearch} setOpen={setOpen} />
              ))
            : !isOpen && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    {chatTypes.map((chatType) => (
                      <Button
                        key={chatType.text}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start gap-3 p-3 h-auto rounded-none hover:bg-muted"
                        onClick={() => setIsOpen(!isOpen)}
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center">
                          <chatType.icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-left text-foreground font-medium">
                          {chatType.text}
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SearchItem({
  item,
  setSearch,
  setOpen,
}: {
  item: Result;
  setSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (item.type === "group") {
      router.push(`/chat/${item.id}`);
      setSearch("");
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await api.post("/chats/dm", { userId: item.id });
      if (!res.data) throw new Error("something went wrong");
      const id = res.data.id;
      router.push(`/chat/${id}`);
      setOpen(false);
      setSearch("");
    });
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-3 py-2 my-2 rounded-lg text-left hover:bg-muted"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src="" />
          <AvatarFallback>
            {item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 justify-center items-start">
          <span className="font-medium">{item.name}</span>
        </div>
      </div>
      <Separator className="w-full" />
    </div>
  );
}
