export interface Message {
  id: string;
  userId:string;
  message: string;
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED";
  date: string;
  // status:"PENDING" | "SENT" | "FAILED";
}

export interface Session {
  status: "un_authenticated" | "authenticated"|"pending";
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profilePicture: string;
  }|null;
}
