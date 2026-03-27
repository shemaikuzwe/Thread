import { useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { Button } from "../ui/button";

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
      const res = await fetcher(`/chats/${id}/join`, { method: "GET" });
      if (!res.ok) {
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
