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
    if (!messages || !read?.last_read || !userId) return null;
    const lastReadIndex = messages.findIndex((msg) => msg.id === read.last_read);
    if (lastReadIndex === -1) return null;
    for (let i = lastReadIndex + 1; i < messages.length; i++) {
      if (messages[i].user_id !== userId) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages, read?.last_read, userId]);
  const handleScroll = (e: React.UIEvent<T, UIEvent>) => {
    const target = e.target as T;
    const offset = 25;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - offset;
    setIsAtBottom(isAtBottom);
    if (isAtBottom && handleMarkAsRead) {
      handleMarkAsRead();
    }
    const isAtTop = target.scrollTop <= 5;
    if (isAtTop) {
      const oldScrollheight = target.scrollHeight;

      if (loadMore) {
        loadMore().then(() => {
          const newScrollheight = target.scrollHeight;
          target.scrollTop = newScrollheight - oldScrollheight;
        });
      }
    }
    setIsAtTop(isAtTop);
  };
  const scrollToBottom = useCallback(
    (bottom?: boolean) => {
      if (messagesRef.current) {
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
      }
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
