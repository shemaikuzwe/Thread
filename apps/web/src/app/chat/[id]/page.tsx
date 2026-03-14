import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ChatView } from "./chat-view";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { id } = await params;
  return <ChatView threadId={id} user={user} />;
}
