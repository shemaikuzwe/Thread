import { useSession } from "@/components/providers/session-provider";
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

export function useChatName(chat: ChatWithUsers | undefined): {
  name: string;
} {
  const data = useSession();
  if (!chat) return { name: "" };
  let name = chat.name;
  if (chat.type === "dm") {
    const filteredUsers = chat.users.filter(
      (user) => user.id != data?.user?.id,
    );
    const fullName =
      filteredUsers[0].first_name + " " + filteredUsers[0].last_name;
    name = fullName;
  }
  return { name };
}
