import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebsocket } from "@/hooks/use-weboscket";
import type {
  ChatWithUsers,
  Message,
  MessageStatus,
  UploadFile,
} from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import ChatHeader from "@/components/chat/chat-header.tsx";
import { ArrowUp, Loader2Icon, Mic, Paperclip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import JoinChat from "@/components/chat/join-chat";
import { useScroll } from "@/hooks/use-scroll";
import Messages from "./messages";
import ScrollAnchor from "./scroll-anchor";
import {
  useMessages,
  useOptimisticUnRead,
  type UnReadMessage,
} from "@/hooks/use-messages";
import { ChatMessagesSkelton } from "@/components/ui/chat-skeltons";
import { useIsTyping } from "@/hooks";
import { FileCard } from "@/components/chat/file-card";
import { useUploadThing } from "@/lib/utils";
import { toast } from "sonner";
import ChatsList from "./chats-list";
import { useIsMobile } from "@/hooks/use-mobile";
import AudioInput from "@/components/chat/audio-input";
import { useSubscriptions } from "@/hooks/use-sub";

export default function ChatPage() {
  const { id } = useParams();
  const [join, setJoin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { sendMessage } = useWebsocket();
  const session = useSession();
  const userId = session?.user?.id;
  if (!id || !userId) throw new Error("id is required");
  const { startUpload } = useUploadThing("media");
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { isTyping, handleTyping } = useIsTyping();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMessages(id);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const { setOptimisticUnread, optimisticUnread } = useOptimisticUnRead(id);
  const lastMessageRef = useRef<string | null>(null);
  const [scroll, setScroll] = useState(false);
  const queryClient = useQueryClient();
  const messages = data?.messages;
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<UploadFile | null>(null);
  const { subscribeToPush } = useSubscriptions();

  const { data: chat, isLoading: loading } = useQuery<ChatWithUsers>({
    queryKey: ["chat-header", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      if (res.status !== 200) throw new Error("Failed to fetch chat");
      return res.data;
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

    if (
      lastMessageRef.current &&
      lastMsgId &&
      lastMsgId !== lastMessageRef.current
    ) {
      setOptimisticUnread(null);
    }

    if (lastMsgId) {
      lastMessageRef.current = lastMsgId;
    }
  }, [messages, setOptimisticUnread]);

  useEffect(() => {
    if (chat && userId) {
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
    const unRead = queryClient.getQueryData<UnReadMessage>([
      "un_read_message",
      id,
    ]);
    if (
      currentMessages &&
      currentMessages.length > 0 &&
      unRead &&
      unRead.unread_count > 0
    ) {
      console.log("handled mark as read");
      const lastMessageId = getLastMessage();
      if (!lastMessageId) return;
      if (lastMessageId !== unRead.last_read) {
        const msg = {
          message: lastMessageId,
          thread_id: id,
          user_id: userId,
          date: new Date().toISOString(),
          type: "UPDATE_LAST_READ",
        };
        void api.post("/messages/last-read", msg);
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
  } = useScroll<HTMLDivElement>(
    id,
    loadMore,
    handleMarkAsRead,
    messages,
    userId,
  );

  const handleSendMessage = useCallback(
    async (
      type: "MESSAGE" | "MESSAGE_STATUS" = "MESSAGE",
      payload?: MessageStatus,
    ) => {
      if (!userId) throw new Error("message is required");
      if (
        type === "MESSAGE" &&
        !(newMessage.trim() || files.length || audioFile)
      )
        return;
      console.log("message", type);
      const message: Message = {
        thread_id: id,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
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
        user_id: userId,
        from: {
          id: userId,
          email: session?.user?.email ?? "",
          first_name: session?.user?.first_name ?? "",
          last_name: session?.user?.last_name ?? "",
          profile_picture: session?.user?.profile_picture ?? "",
        },
      };
      //Optimistic ui
      if (type === "MESSAGE") {
        queryClient.setQueryData(
          ["chat", message.thread_id],
          (oldData: any) => {
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
            const currentMessages = Array.isArray(lastPage?.messages)
              ? lastPage.messages
              : [];

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
          },
        );
      }

      if ((files.length || audioFile) && type === "MESSAGE") {
        const toUpload = audioFile
          ? [audioFile.file]
          : files.map((f) => f.file);
        const uploaded = await startUpload(toUpload);
        if (!uploaded?.length) {
          toast.error("Failed to upload files");
        }
        await api.post("/messages", {
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
        await api.post("/messages", message);
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

      const fileUrl = await new Promise<string | ArrayBuffer | null>(
        (resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result ?? null);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        },
      );

      if (fileUrl) newFiles.push({ dataUrl: fileUrl as string, file });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  return (
    <div className="flex gap-2 w-full h-full">
      {!isMobile && <ChatsList />}
      <div className="gray-50 flex w-full">
        {/* Main Chat Area */}
        <div className="flex-1 w-full flex flex-col">
          <ChatHeader
            join={join}
            setJoin={setJoin}
            loading={loading}
            chat={chat}
          />

          <ScrollArea
            onScrollCapture={handleScroll}
            className="flex-1 w-full p-6 space-y-4 min-h-0"
          >
            {isLoading ? (
              <ChatMessagesSkelton />
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
            <ScrollAnchor
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
            />
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
                        className="p-2 h-auto flex-shrink-0"
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
