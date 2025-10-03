export interface Message {
  id: string;
  userId: string;
  channel_id: string;
  message: string;
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED";
  date: string;
  // status:"PENDING" | "SENT" | "FAILED";
}

export type Channel = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

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
