export interface Message {
  id: string;
  message: string;
  type: "USER_CONNECTED" | "MESSAGE" | "USER_DISCONNECTED";
  date: string;
}

export interface Session {
  status: "un_authenticated" | "authenticated";
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}
