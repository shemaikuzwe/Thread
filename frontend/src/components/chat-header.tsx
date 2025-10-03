import { api } from "@/lib/axios";
import type { Channel } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Props {
  active: number | boolean;
}

export default function ChatHeader({ active }: Props) {
  const { id } = useParams();
  if (!id) throw new Error("Missing chat ID");
  const { data: chat, isLoading } = useQuery<Channel>({
    queryKey: ["chats", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      if (res.status !== 200) throw new Error("Failed to fetch chat");
      return res.data;
    },
  });
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2">
      {isLoading ? (
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
              <h1 className="text-lg font-semibold text-gray-900">
                {chat?.name}
              </h1>
              <p className="text-sm text-gray-500">
                {typeof active === "number"
                  ? active > 0
                    ? active
                    : ""
                  : active && "active"}
                Active
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
