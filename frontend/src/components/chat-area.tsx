import { useState } from "react";
import { Send, Smile, Paperclip, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "react-router-dom";
import { useChannels } from "@/hooks/use-channel";

interface Message {
  id: string;
  message: string;
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED";
  date: string;
}

export const ChatArea = () => {
  const { channelId, dmId } = useParams();
  const [active, setActive] = useState(0);

  const { getChannel } = useChannels();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const currentChannel = channelId || dmId || "general";
  const isDirectMessage = !!dmId;

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      message: message,
      type: "MESSAGE",
      date: new Date().toISOString(),
    };

    // ws.send(JSON.stringify(newMessage));

    setMessages([...messages, newMessage]);
    setMessage("");
  };
  // ws.onmessage = (e) => {
  //   const msg = JSON.parse(e.data) as Message;
  //   console.log("received msg", msg);

  //   if (msg.type == "USER_CONNECTED") {
  //     setActive(Number(msg.message));
  //   }
  //   if (msg.type == "USER_DISCONNECTED") {
  //     setActive(Number(msg.message));
  //   }
  //   if (msg.type == "MESSAGE") {
  //     setMessages([...messages, msg]);
  //   }
  // };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChannelDisplayName = () => {
    return `# ${currentChannel}`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat header */}
      <div className="border-b bg-background px-6 py-4">
        <h2 className="text-2xl font-semibold">{getChannelDisplayName()}</h2>
        {active > 1 && <span className="text-sm">{active} online</span>}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 hover:bg-slack-message-hover rounded-lg p-2 -mx-2 transition-colors"
            >
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarImage src={"/default.png"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {"user"
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {/* <div className="flex items-baseline space-x-2">
                  <span className="font-medium text-sm">{msg.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div> */}
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {msg.message}
                </p>
                {/* {msg.reactions && (
                  <div className="flex space-x-1 mt-2">
                    {msg.reactions.map((reaction, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        {reaction.emoji} {reaction.count}
                      </Button>
                    ))}
                  </div>
                )} */}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyUp={handleKeyUp}
              placeholder={`Message ${getChannelDisplayName()}`}
              className="pr-24 min-h-[44px] resize-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <AtSign className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
