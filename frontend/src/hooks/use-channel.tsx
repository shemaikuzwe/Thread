import { useState, useCallback } from "react";

export interface Channel {
  id: string;
  name: string;
  description?: string;
  unread: number;
  createdAt: Date;
}

const initialChannels: Channel[] = [
  { id: "general", name: "general", unread: 0, createdAt: new Date(Date.now() - 86400000) },
  { id: "random", name: "random", unread: 3, createdAt: new Date(Date.now() - 82800000) },
  { id: "development", name: "development", unread: 1, createdAt: new Date(Date.now() - 79200000) },
  { id: "design", name: "design", unread: 0, createdAt: new Date(Date.now() - 75600000) },
];

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const createChannel = useCallback((name: string, description?: string) => {
    const newChannel: Channel = {
      id: name,
      name,
      description,
      unread: 0,
      createdAt: new Date(),
    };

    setChannels(prev => [...prev, newChannel]);
    return newChannel;
  }, []);

  const getChannel = useCallback((id: string) => {
    return channels.find(channel => channel.id === id);
  }, [channels]);

  const updateChannelUnread = useCallback((id: string, unread: number) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.id === id ? { ...channel, unread } : channel
      )
    );
  }, []);

  return {
    channels,
    createChannel,
    getChannel,
    updateChannelUnread,
  };
};