import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { User } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetcher";
import { AvatarImage } from "./avatar";

const defaultAvatar = "/default.png";

export default function MessageUser({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [userId],
    queryFn: async () => {
      const res = await fetcher(`/users/${userId}`, { method: "GET" });
      if (!res.ok) {
        throw new Error("Something went wrong");
      }
      return await res.json();
    },
  });
  return (
    <div className="flex justify-center items-center gap-2">
      {isLoading ? null : (
        <Avatar>
          <AvatarImage src={user?.image ?? defaultAvatar} />
          <AvatarFallback>
            {user?.name?.split(" ").map((n: string) => n[0]?.toUpperCase())}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
