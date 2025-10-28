export interface Message {
  id: string;
  user_id: string;
  channel_id: string;
  message: any;
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

export type Theme = "dark" | "light" | "system";

export type Channel = {
  id: string;
  name: string;
  type: "group" | "dm";
  description: string;
  created_at: string;
  updated_at: string;
};
export interface ChannelWithUsers extends Channel {
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

export interface Active {
  active: number;
  users: string[];
}
