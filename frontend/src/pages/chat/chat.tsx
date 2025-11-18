import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-weboscket";
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
import { ArrowUp, Paperclip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import JoinChat from "@/components/chat/join-chat";
import { useScroll } from "@/hooks/use-scroll";
import Messages from "./messages";
import ScrollAnchor from "./scroll-anchor";
import {
  useMessages,
  useUnReadMessages,
  type UnReadMessage,
} from "@/hooks/use-messages";
import { ChatMessagesSkelton } from "@/components/ui/chat-skeltons";
import { useIsTyping } from "@/hooks";
import { FileCard } from "@/components/chat/file-card";
import { useUploadThing } from "@/lib/utils";
import { toast } from "sonner";
import ChatsList from "./chats-list";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChatPage() {
  const { id } = useParams();
  const [join, setJoin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { sendMessage } = useWebSocket();
  const session = useSession();
  const userId = session?.user?.id;
  if (!id || !userId) throw new Error("id is required");
  const { startUpload } = useUploadThing("media");
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { isTyping, handleTyping } = useIsTyping();
  const { data: messages, isLoading } = useMessages(id);
  const { data: unReadMessages } = useUnReadMessages(id);

  const queryClient = useQueryClient();
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
    if (chat && userId) {
      if (!chat.users.some((user) => user.id === userId)) {
        setJoin(true);
      }
    }
  }, [chat, userId]);

  const handleMarkAsRead = useCallback(
    (opts?: { query?: true }) => {
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
        console.log("mark as read called");
        const lastMessageId = getLastMessage();
        if (!lastMessageId) return;
        if (lastMessageId !== unRead.last_read) {
          if (opts?.query) {
            queryClient.setQueryData(
              ["un_read_message", id],
              (oldData: UnReadMessage | undefined) => {
                if (oldData && oldData.unread_count > 0) {
                  return { last_read: lastMessageId, unread_count: 0 };
                }
                return oldData;
              },
            );
          }
          const msg = {
            message: lastMessageId,
            channel_id: id,
            user_id: userId,
            date: new Date().toISOString(),
            type: "UPDATE_LAST_READ",
          };
          sendMessage(msg);
        }
      }
    },
    [id, sendMessage, userId, queryClient],
  );

  const handleSendMessage = useCallback(
    async (
      type: "MESSAGE" | "MESSAGE_STATUS" = "MESSAGE",
      payload?: MessageStatus,
    ) => {
      if (!userId) throw new Error("message is required");
      if (type === "MESSAGE" && !newMessage.trim() && !files.length) return;
      const message: Message = {
        channel_id: id,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        files:
          files.map((f) => ({
            name: f.file.name,
            size: f.file.size,
            type: f.file.type,
            url: f.dataUrl as string,
          })) ?? [],
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
          ["chat", message.channel_id],
          (oldMsg: Message[]): Message[] => {
            if (oldMsg && oldMsg.length) {
              return [...oldMsg, { ...message, status: "PENDING" }];
            }
            return [{ ...message, status: "PENDING" }];
          },
        );
      }
      if (type === "MESSAGE") {
        setNewMessage("");
        setFiles([]);
        handleMarkAsRead({ query: true });
      }
      if (files.length && type === "MESSAGE") {
        const uploaded = await startUpload(files.map((f) => f.file));
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
      } else {
        sendMessage(message);
      }
    },
    [
      handleMarkAsRead,
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
  }, [isTyping]);
  const {
    isAtBottom,
    scrollToBottom,
    messagesRef: ref,
    handleScroll,
  } = useScroll<HTMLDivElement>(id);

  useEffect(() => {
    if (messages && unReadMessages) {
      if (unReadMessages.unread_count > 0 && unReadMessages.last_read) {
        setTimeout(() => {
          const element = document.getElementById(unReadMessages.last_read!);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            scrollToBottom(true);
          }
        }, 100);
      } else {
        scrollToBottom(true);
      }
    }
  }, [messages, unReadMessages, scrollToBottom]);

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
          reader.readAsDataURL(file); // for images/base64
          // else if (
          //   file.type.startsWith("text/") ||
          //   file.type.startsWith("application/json")
          // ) {
          //   reader.readAsText(file);
          // }
        },
      );

      if (fileUrl) newFiles.push({ dataUrl: fileUrl as string, file });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  function getLastMessage() {
    if (!userId) return;
    const messages = messagesRef.current;
    if (!messages || messages.length === 0) {
      return;
    }
    return messages[messages.length - 1].id;
  }

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
              <Messages
                messagesRef={messagesRef}
                handleOnMarkAsRead={handleMarkAsRead}
                chatId={id}
                ref={ref}
                messages={messages}
                chatType={chat?.type}
                userId={userId}
              />
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
                  <Button
                    onClick={() => handleSendMessage("MESSAGE")}
                    disabled={!newMessage.trim() && !files.length}
                    size={"icon"}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
