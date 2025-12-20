import React, { useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useUnReadMessages } from "./use-messages";

function useScroll<T extends HTMLElement>(
  id: string,
  loadMore?: () => Promise<void>,
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
  const handleScroll = (e: React.UIEvent<T, UIEvent>) => {
    const target = e.target as T;
    const offset = 25;
    const isAtBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - offset;
    setIsAtBottom(isAtBottom);
    const isAtTop = target.scrollTop <= 5;
    if (isAtTop) {
      console.log("is at top");
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
        if (read?.last_read && !bottom) {
          const last_readRed = document.getElementById(read.last_read);
          last_readRed?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          return;
        }
        messagesRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    },
    [read?.last_read],
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
