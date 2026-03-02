export type MessageFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};
export interface Message {
  id: string;
  userId: string;
  threadId: string;
  message: any;
  status?: "PENDING" | "SENT" | "FAILED";
  files: MessageFile[];
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED" | "MESSAGE_STATUS" | "UPDATE_LAST_READ";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  };
}
//CURRENT MESSAGE
export type MessageStatus = {
  status: "TYPING" | "RECORDING_AUDIO" | "DEFAULT";
};
export interface UploadFile {
  dataUrl: string;
  file: File;
}
//Message in general
export type Status = "PENDING" | "FAILED" | "SENT";

export type Chat = {
  id: string;
  name: string | null;
  type: "group" | "dm";
  description: string;
  created_at: string;
  updated_at: string;
};
export interface ChatWithUsers extends Chat {
  users: User[];
  last_message: {
    id: string;
    message: string;
    user_id: string;
    created_at: string;
  } | null;
}

export interface Session {
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
    };
    session: any;
  } | null;
  isPending: boolean;
  error: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

export interface Online {
  online: number;
  users: string[];
}
