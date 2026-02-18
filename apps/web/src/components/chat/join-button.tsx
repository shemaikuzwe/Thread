import { Button } from "../ui/button";
import { api } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

export default function JoinButton({
  id,
  setJoin,
}: {
  id: string;
  setJoin: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const queryClient = useQueryClient();
  const handleJoin = async () => {
    try {
      const res = await api.get(`/chats/${id}/join`);
      if (!res.data) {
        throw new Error("Failed to join chat");
      }
      queryClient.invalidateQueries({ queryKey: ["chat-header", id] });
      setJoin(false);
    } catch (err) {
      console.error(err);
    }
  };
  return <Button onClick={handleJoin}>Join</Button>;
}
