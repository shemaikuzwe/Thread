import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ChatLayout } from "./chat-layout";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return <ChatLayout user={user} />;
}
