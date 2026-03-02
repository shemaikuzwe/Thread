import React, { useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useUnReadMessages } from "./use-messages";
import type { Message } from "@/lib/types";

function useScroll<T extends HTMLElement>(
  id: string,
  loadMore?: () => Promise<void>,
  handleMarkAsRead?: () => void,
  messages?: Message[],
  userId?: string,
) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const messagesRef = useRef<T>(null);
  const { data: read } = useUnReadMessages(id);
  const { ref: visibilityRef, inView: isVisible } = useInView({
    triggerOnce: false,
    delay: 100,
    rootMargin: "0px 0px 0px 0px",
  });

  const getFirstUnreadMessage = useCallback(() => {
    if (!messages || !read?.lastRead || !userId) return null;
    const lastReadIndex = messages.findIndex((msg) => msg.id === read.lastRead);
    if (lastReadIndex === -1) return null;

    for (let i = lastReadIndex + 1; i < messages.length; i++) {
      if (messages[i].userId !== userId) {
        return messages[i].id;
      }
    }

    return null;
  }, [messages, read?.lastRead, userId]);

  const handleScroll = (e: React.UIEvent<T, UIEvent>) => {
    const target = e.target as T;
    const offset = 25;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - offset;
    setIsAtBottom(atBottom);

    if (atBottom && handleMarkAsRead) {
      handleMarkAsRead();
    }

    const atTop = target.scrollTop <= 5;
    if (atTop) {
      const oldScrollHeight = target.scrollHeight;
      if (loadMore) {
        loadMore().then(() => {
          const newScrollHeight = target.scrollHeight;
          target.scrollTop = newScrollHeight - oldScrollHeight;
        });
      }
    }

    setIsAtTop(atTop);
  };

  const scrollToBottom = useCallback(
    (bottom?: boolean) => {
      if (!messagesRef.current) return;

      if (!bottom) {
        const firstUnreadId = getFirstUnreadMessage();
        if (firstUnreadId) {
          const element = document.getElementById(firstUnreadId);
          element?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          return;
        }
      }

      messagesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    },
    [getFirstUnreadMessage],
  );

  return {
    messagesRef,
    visibilityRef,
    scrollToBottom,
    isAtBottom,
    handleScroll,
    isVisible,
    isAtTop,
  };
}

export { useScroll };
