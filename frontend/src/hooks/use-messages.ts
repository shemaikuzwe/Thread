import { api } from "@/lib/axios";
import type { Online, Message, MessageStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export const useMessages = (id: string) => {
  return useQuery<Message[]>({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}/messages`);
      if (res.status !== 200) throw new Error("Failed to fetch messages");
      return res.data;
    },
  });
};
export const useOnline = (id: string) => {
  return useQuery<Online>({
    initialData: { online: 0, users: [] },
    queryKey: ["online", id],
    queryFn: () => {
      return { online: 0, users: [] };
    },
    enabled: false, //prevents auto execution of queryFn
  });
};

export const useMessageStatus = (id: string) => {
  return useQuery<MessageStatus>({
    initialData: { status: "DEFAULT" },
    queryKey: ["msg-status", id],
    queryFn: () => {
      return { status: "DEFAULT" };
    },
    enabled: false,
  });
};
