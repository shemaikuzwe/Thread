import { ChatArea } from "@/components/chat-area"
import { Sidebar } from "@/components/sidebar";

const DirectMessage = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default DirectMessage;