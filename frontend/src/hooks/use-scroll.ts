import React, { useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useUnReadMessages } from "./use-messages";

function useScroll<T extends HTMLElement>(id: string) {
  const [isAtBottom, setIsAtBottom] = useState(true);
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
  };
}

export { useScroll };
