"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Loader2Icon, Mic, Paperclip } from "lucide-react";
import { toast } from "sonner";
import AudioInput from "@/components/chat/audio-input";
import ChatHeader from "@/components/chat/chat-header";
import ChatsList from "@/components/chat/chats-list";
import { FileCard } from "@/components/chat/file-card";
import JoinChat from "@/components/chat/join-chat";
import Messages from "@/components/chat/messages";
import ScrollAnchor from "@/components/chat/scroll-anchor";
import { Button } from "@/components/ui/button";
import { ChatMessagesSkeleton } from "@/components/ui/chat-skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsTyping } from "@/hooks";
import { useMessages, useOptimisticUnRead, type UnReadMessage } from "@/hooks/use-messages";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScroll } from "@/hooks/use-scroll";
import { useWebsocket } from "@/hooks/websocket-provider";
import { useSession } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetcher";
import type { ChatWithUsers, Message, MessageStatus, UploadFile } from "@/lib/types";
import { useUploadThing } from "@/lib/utils";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [join, setJoin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { sendMessage } = useWebsocket();
  const session = useSession();
  const userId = session?.data?.user?.id;

  const { startUpload } = useUploadThing("media");
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { isTyping, handleTyping } = useIsTyping();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessages(id);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const { setOptimisticUnread, optimisticUnread } = useOptimisticUnRead(id);
  const lastMessageRef = useRef<string | null>(null);
  const [scroll, setScroll] = useState(false);
  const queryClient = useQueryClient();
  const messages = data?.messages;
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<UploadFile | null>(null);

  const { data: chat, isLoading: loading } = useQuery<ChatWithUsers>({
    queryKey: ["chat-header", id],
    queryFn: async () => {
      const res = await fetcher(`/chats/${id}`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch chat");
      return (await res.json()) as ChatWithUsers;
    },
  });
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    lastMessageRef.current = null;
  }, [id]);

  useEffect(() => {
    const lastMsg = messages?.[messages.length - 1];
    const lastMsgId = lastMsg?.id;

    if (lastMessageRef.current && lastMsgId && lastMsgId !== lastMessageRef.current) {
      setOptimisticUnread(null);
    }

    if (lastMsgId) {
      lastMessageRef.current = lastMsgId;
    }
  }, [messages, setOptimisticUnread]);

  useEffect(() => {
    if (chat && userId) {
      console.log("users", chat.users);
      if (!chat.users.some((user) => user.id === userId)) {
        setJoin(true);
      }
    }
  }, [chat, userId]);
  const getLastMessage = useCallback(() => {
    if (!userId) return;
    const currentMsgs = messagesRef.current;
    if (!currentMsgs || currentMsgs.length === 0) {
      return;
    }
    return currentMsgs[currentMsgs.length - 1]?.id;
  }, [userId]);

  const handleMarkAsRead = useCallback(() => {
    const currentMessages = messagesRef.current;
    const unRead = queryClient.getQueryData<UnReadMessage>(["un_read_message", id]);
    if (currentMessages && currentMessages.length > 0 && unRead && unRead.unreadCount > 0) {
      console.log("handled mark as read");
      const lastMessageId = getLastMessage();
      if (!lastMessageId || !userId) return;
      if (lastMessageId !== unRead.lastRead) {
        const msg:Message = {
          message: lastMessageId,
          id:crypto.randomUUID(),
          threadId: id,
          userId: userId,

          createdAt: new Date().toISOString(),
          type: "UPDATE_LAST_READ",
        };
        sendMessage(msg);
      }
    }
  }, [id, queryClient, getLastMessage, userId, sendMessage]);

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const {
    isAtBottom,
    scrollToBottom,
    messagesRef: ref,
    handleScroll,
  } = useScroll<HTMLDivElement>(id, loadMore, handleMarkAsRead, messages, userId);

  const handleSendMessage = useCallback(
    async (type: "MESSAGE" | "MESSAGE_STATUS" = "MESSAGE", payload?: MessageStatus) => {
      if (!userId) return;
      if (type === "MESSAGE" && !(newMessage.trim() || files.length || audioFile)) return;
      console.log("message", type);
      const message: Message = {
        threadId: id,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        files: files.length
          ? files.map((f) => ({
              name: f.file.name,
              size: f.file.size,
              type: f.file.type,
              url: f.dataUrl as string,
            }))
          : audioFile
            ? [
                {
                  name: audioFile.file.name,
                  size: audioFile.file.size,
                  type: audioFile.file.type,
                  url: audioFile.dataUrl as string,
                },
              ]
            : [],
        message: type === "MESSAGE" ? newMessage : (payload?.status ?? ""),
        type: type,
        userId: userId,
        user: {
          id: userId,
          email: session?.data?.user?.email ?? "",
          name: session?.data?.user?.name ?? "",
          image: session?.data?.user?.image ?? "",
        },
      };
      //Optimistic ui
      if (type === "MESSAGE") {
        queryClient.setQueryData(["chat", message.threadId], (oldData: any) => {
          if (!oldData?.pages) {
            return {
              pages: [
                {
                  messages: [{ ...message, status: "PENDING" }],
                  total: 1,
                  nextOffset: 1,
                },
              ],
              pageParams: [0],
            };
          }

          const newPages = [...oldData.pages];
          const lastPage = newPages[newPages.length - 1];
          const currentMessages = Array.isArray(lastPage?.messages) ? lastPage.messages : [];

          // Add new message to the last page
          newPages[newPages.length - 1] = {
            ...lastPage,
            messages: [...currentMessages, { ...message, status: "PENDING" }],
            total: (lastPage?.total || 0) + 1,
          };

          return {
            ...oldData,
            pages: newPages,
          };
        });
      }

      if ((files.length || audioFile) && type === "MESSAGE") {
        const toUpload = audioFile ? [audioFile.file] : files.map((f) => f.file);
        const uploaded = await startUpload(toUpload);
        if (!uploaded?.length) {
          toast.error("Failed to upload files");
        }
        sendMessage({
          ...message,
          files:
            uploaded?.map((upload) => ({
              name: upload.name,
              type: upload.type,
              url: upload.ufsUrl,
              size: upload.size,
            })) ?? [],
        });
      } else if (type === "MESSAGE") {
        sendMessage(message);
      } else {
        sendMessage(message);
      }
      if (type === "MESSAGE") {
        setScroll(true);
        setNewMessage("");
        setFiles([]);
        setOptimisticUnread(null);
      }
    },
    [
      audioFile,
      setOptimisticUnread,
      sendMessage,
      id,
      session,
      newMessage,
      files,
      queryClient,
      userId,
      startUpload,
    ],
  );
  useEffect(() => {
    if (isTyping) {
      handleSendMessage("MESSAGE_STATUS", { status: "TYPING" });
    } else {
      handleSendMessage("MESSAGE_STATUS", { status: "DEFAULT" });
    }
  }, [isTyping, handleSendMessage]);

  useEffect(() => {
    if (scroll) {
      scrollToBottom(true);
    }
    return () => {
      setScroll(false);
    };
  }, [messages, scrollToBottom, scroll]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.currentTarget.files;
    if (!fileList || !fileList.length) return;

    const newFiles: UploadFile[] = [];

    for (const file of Array.from(fileList)) {
      const reader = new FileReader();

      const fileUrl = await new Promise<string | ArrayBuffer | null>((resolve, reject) => {
        reader.onload = (event) => resolve(event.target?.result ?? null);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      if (fileUrl) newFiles.push({ dataUrl: fileUrl as string, file });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  if (!userId) return null;

  return (
    <div className="flex gap-2 w-full h-full">
      {!isMobile && <ChatsList />}
      <div className="gray-50 flex w-full">
        {/* Main Chat Area */}
        <div className="flex-1 w-full flex flex-col">
          <ChatHeader join={join} setJoin={setJoin} loading={loading} chat={chat} />

          <ScrollArea
            onScrollCapture={handleScroll}
            className="flex-1 w-full p-6 space-y-4 min-h-0"
          >
            {isLoading ? (
              <ChatMessagesSkeleton />
            ) : join && chat ? (
              <JoinChat chat={chat} setJoin={setJoin} />
            ) : (
              <>
                {isFetchingNextPage && (
                  <div className="flex justify-center items-center">
                    <Loader2Icon className="animate-spin text-primary" />
                  </div>
                )}
                <Messages
                  messagesRef={messagesRef}
                  chatId={id}
                  ref={ref}
                  messages={messages}
                  chatType={chat?.type}
                  userId={userId}
                  optimisticUnread={optimisticUnread}
                  setOptimisticUnread={setOptimisticUnread}
                />
              </>
            )}
          </ScrollArea>
          <div className="mx-auto flex justify-center items-center pb-2 pt-0 z-100">
            <ScrollAnchor isAtBottom={isAtBottom} scrollToBottom={scrollToBottom} />
          </div>
          <div className="w-full z-10">
            <div className="p-2 flex flex-col w-full h-full">
              <div className="flex flex-col w-full h-full gap-2 p-4 border border-border rounded-md focus-within:ring-2 focus-within:ring-ring/50">
                {files.length > 0 && (
                  <div className="flex gap-5 justify-start items-center">
                    {files.map((file, index) => (
                      <FileCard
                        key={index}
                        file={file}
                        handleRemove={() => {
                          setFiles(files.filter((_, idx) => idx !== index));
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center w-full h-full">
                  {!isRecording && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-2 h-auto shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        multiple
                      />
                      <textarea
                        value={newMessage ?? ""}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage("MESSAGE");
                          }
                        }}
                        placeholder="Send a message..."
                        rows={1}
                        className="border-none px-2 outline-none focus:outline-none focus:ring-0 w-full resize-none"
                      />
                    </>
                  )}

                  <AudioInput
                    ref={audioButtonRef}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    setFile={setAudioFile}
                    onRecordDone={() => handleSendMessage("MESSAGE")}
                  />
                  {!newMessage.trim() && !files.length ? (
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        audioButtonRef.current?.click();
                      }}
                    >
                      {isRecording ? (
                        <ArrowUp className="h-10 w-10" />
                      ) : (
                        <Mic className="h-10 w-10" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSendMessage("MESSAGE")}
                      disabled={!newMessage.trim() && !files.length}
                      size={"icon"}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
