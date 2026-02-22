import { useSession } from "@/lib/auth-client";
import type { ChatWithUsers } from "@/lib/types";
import { useState, useEffect, useRef } from "react";

export function useIsTyping(delay = 1000) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const handleTyping = () => {
    setIsTyping(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isTyping, handleTyping };
}

export function useChatMeta(chat: ChatWithUsers | undefined): {
  name: string;
  avatar?: string;
} {
  const session = useSession();
  const data = session.data;
  if (!chat) return { name: "" };
  let name = chat.name;
  let avatar: string | undefined = "";
  if (chat.type === "dm") {
    const filteredUsers = chat.users.filter((user) => user.id != data?.user?.id);
    name = filteredUsers[0].name;
    avatar = filteredUsers[0]?.image;
  }
  return { name: name || "", avatar };
}
