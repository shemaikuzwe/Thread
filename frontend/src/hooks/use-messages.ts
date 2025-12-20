import { api } from "@/lib/axios";
import type { Online, Message, MessageStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type MessagesRes = {
  messages: Message[];
  total: number;
};
export const useMessages = (id: string, limit: number) => {
  return useQuery<MessagesRes>({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}/messages?limit=${limit}`);
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
export type UnReadMessage = {
  last_read: string | null;
  unread_count: number;
};
export const useUnReadMessages = (id: string, initialData?: UnReadMessage) => {
  return useQuery<UnReadMessage>({
    initialData,
    queryKey: ["un_read_message", id],
    queryFn: () => {
      return { last_read: "", unread_count: 0 };
    },
    enabled: false,
  });
};
export const useOptimisticUnRead = (id: string) => {
  const [optimisticUnread, setOptimisticUnread] =
    useState<UnReadMessage | null>(null);
  const { data: unReadMessages } = useUnReadMessages(id);
  useEffect(() => {
    if (unReadMessages && optimisticUnread === null) {
      setOptimisticUnread(unReadMessages);
    }
  }, [unReadMessages, optimisticUnread]);
  return { optimisticUnread, setOptimisticUnread };
};
