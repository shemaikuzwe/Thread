import { api } from "@/lib/axios";
import type { Online, Message, MessageStatus } from "@/lib/types";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef, useMemo } from "react";

export type MessagesRes = {
  messages: Message[];
  total: number;
  nextCursor?: number | null;
};

export const useMessages = (id: string, limit: number = 15) => {
  const query = useInfiniteQuery<MessagesRes>({
    queryKey: ["chat", id],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (pageParam) {
        params.set("cursor", pageParam.toString());
      }
      const res = await api.get(`/chats/${id}/messages?${params.toString()}`);
      if (res.status !== 200) throw new Error("Failed to fetch messages");
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
  const messages = useMemo(() => {
    if (!query.data?.pages) return undefined;
    return query.data.pages.flatMap((page) => page.messages);
  }, [query.data?.pages]);

  const total = query.data?.pages[0]?.total;

  return {
    ...query,
    data: { messages, total },
  };
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
  const [optimisticUnread, setOptimisticUnread] = useState<UnReadMessage | null>(null);
  const { data: unReadMessages } = useUnReadMessages(id);

  const initialized = useRef(false);

  useEffect(() => {
    setOptimisticUnread(null);
    initialized.current = false;
  }, [id]);

  useEffect(() => {
    if (unReadMessages && !initialized.current) {
      setOptimisticUnread(unReadMessages);
      initialized.current = true;
    }
  }, [unReadMessages]);
  return { optimisticUnread, setOptimisticUnread };
};
