import { api } from "@/lib/axios";
import type { Message, MessageStatus } from "@/lib/types";
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
export const useActive = (id: string) => {
  return useQuery<number>({
    initialData: 0,
    queryKey: ["active", id],
    queryFn: () => 0,
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
