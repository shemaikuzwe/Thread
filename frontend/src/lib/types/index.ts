type MessageFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};
export interface Message {
  id: string;
  user_id: string;
  channel_id: string;
  message: any;
  files: MessageFile[];
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED" | "MESSAGE_STATUS";
  created_at: string;
  from: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
  };
}

export type MessageStatus = {
  status: "TYPING" | "RECORDING_AUDIO" | "DEFAULT";
};
export interface UploadFile {
  dataUrl: string | ArrayBuffer | null;
  file: File;
}

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
}

export interface Session {
  status: "un_authenticated" | "authenticated" | "pending";
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
  } | null;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string;
}

export interface Online {
  online: number;
  users: string[];
}
