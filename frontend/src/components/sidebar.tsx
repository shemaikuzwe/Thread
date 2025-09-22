import { useState } from "react";
import { Hash, Plus, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useChannels } from "@/hooks/use-channel";
import { CreateChannelDialog } from "./create-channel";

const directMessages = [
  { id: "john", name: "John Doe", avatar: "", status: "online", unread: 2 },
  { id: "sarah", name: "Sarah Smith", avatar: "", status: "away", unread: 0 },
  { id: "mike", name: "Mike Johnson", avatar: "", status: "online", unread: 1 },
];

export const Sidebar = () => {
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const { channels, createChannel } = useChannels();
  const navigate = useNavigate();
  const handleCreateChannel = (name: string) => {
    // Check if channel already exists
    const existingChannel = channels.find((ch) => ch.id === name);
    if (existingChannel) {
      toast.error("Channel already exists", {
        description: `A channel named #${name} already exists.`,
      });
      return;
    }

    const newChannel = createChannel(name);
    toast.info("Channel created", {
      description: `#${newChannel.name} has been created successfully!`,
    });
    navigate(`/channel/${newChannel.id}`);
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      {/* Workspace header */}
      <div className="p-4 border-b border-slack-sidebar-hover">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Acme</h1>
          {/* <Button
            size="sm"
            variant="outline"
          >
            <ChevronDown className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      {/* Channels section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-sm font-medium text-gray-300">Channels</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-300 hover:bg-slack-sidebar-hover"
              onClick={() => setIsCreateChannelOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {channels.map((channel) => (
            <NavLink
              key={channel.id}
              to={`/channel/${channel.id}`}
              className={({ isActive }) =>
                `flex items-center px-2 py-1 rounded text-sm hover:bg-slack-sidebar-hover transition-colors ${
                  isActive
                    ? "bg-slack-sidebar-active text-white"
                    : "text-gray-300"
                }`
              }
            >
              <Hash className="h-4 w-4 mr-2" />
              <span className="flex-1">{channel.name}</span>
              {channel.unread > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                  {channel.unread}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Direct Messages section */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-sm font-medium text-gray-300">
              Direct Messages
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-300 hover:bg-slack-sidebar-hover"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {directMessages.map((dm) => (
            <NavLink
              key={dm.id}
              to={`/dm/${dm.id}`}
              className={({ isActive }) =>
                `flex items-center px-2 py-1 rounded text-sm hover:bg-slack-sidebar-hover transition-colors ${
                  isActive
                    ? "bg-slack-sidebar-active text-white"
                    : "text-gray-300"
                }`
              }
            >
              <div className="relative mr-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={dm.avatar} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {dm.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slack-sidebar ${
                    dm.status === "online" ? "bg-slack-online" : "bg-slack-away"
                  }`}
                />
              </div>
              <span className="flex-1 truncate">{dm.name}</span>
              {dm.unread > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                  {dm.unread}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-t border-slack-sidebar-hover">
        <div className="flex items-center">
          <div className="relative mr-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                YU
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slack-sidebar bg-slack-online" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">You</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
        </div>
      </div>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />
    </div>
  );
};
