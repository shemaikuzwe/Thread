import { User } from "../auth-client";

export type MessageFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export interface ChatMessageUser {
  id: string;
  email: string;
  name: string;
  image: string;
}

export interface Message {
  id: string;
  userId: string;
  threadId: string;
  message: string;
  status?: "PENDING" | "SENT" | "FAILED";
  files: MessageFile[];
  type:
    | "USER_CONNECTED"
    | "MESSAGE"
    | "USER_DISCONNECTED"
    | "MESSAGE_STATUS"
    | "UPDATE_LAST_READ";
  createdAt: string;
  user: ChatMessageUser;
}

export type MessageStatus = {
  status: "TYPING" | "RECORDING_AUDIO" | "DEFAULT";
};

export interface UploadFile {
  dataUrl: string;
  file: File;
}

export type Status = "PENDING" | "FAILED" | "SENT";

export type Chat = {
  id: string;
  name: string | null;
  type: "group" | "dm";
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserAvatar={
  id: string;
  name: string;
  image: string;
  email: string;
}
export interface ChatWithUsers extends Chat {
  users: User[];
  lastMessage: {
    id: string;
    message: string;
    userId: string;
    createdAt: string;
  } | null;
}

export interface Online {
  online: number;
  users: string[];
}



