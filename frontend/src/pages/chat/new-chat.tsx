import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatListSkelton } from "@/components/ui/chat-skeltons";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchInput from "@/components/ui/search-input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { useNavigate } from "react-router";

type Result = {
  id: string;
  name: string;
  type: "group" | "dm";
};

export default function NewChat() {
  const [search, setSearch] = useState<string>();
  const [open, setOpen] = useState(true);
  const { data, isLoading } = useQuery<Result[]>({
    queryKey: ["new-chat", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      const res = await api.get(`/chats/new?${params.toString()}`);
      if (!res.data) {
        return null;
      }
      return res.data;
    },
    enabled: !!search,
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <Button size={"sm"}>New</Button>
      </DialogTrigger>
      <DialogContent className="w-150 min-h-80 flex flex-col gap-2">
        <SearchInput
          placeholder="Search new  user,channel"
          onSearch={(search) => setSearch(search)}
        />
        <ScrollArea className="flex flex-col h-full w-full justify-start items-start">
          {isLoading && <ChatListSkelton />}
          {data &&
            data.length > 0 &&
            data.map((d) => (
              <SearchItem
                key={d.id}
                item={d}
                setSearch={setSearch}
                setOpen={setOpen}
              />
            ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function SearchItem({
  item,
  setSearch,
  setOpen,
}: {
  item: Result;
  setSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const handleClick = () => {
    if (item.type === "group") {
      navigate(`/chat/${item.id}`);
      setSearch("");
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await api.post("/chats/dm", { user_id: item.id });
      if (!res.data) throw new Error("something went wrong");
      const id = res.data.id;
      navigate(`/chat/${id}`);
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
          <AvatarImage src={""} />
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
