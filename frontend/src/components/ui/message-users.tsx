import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "./avatar";
import defaultAvatar from "@/assets/default.png";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { type User } from "@/lib/types";

export default function MessageUser({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}`);
      if (res.status !== 200) {
        throw new Error("Something went wrong");
      }
      return res.data;
    },
  });
  return (
    <div className="flex justify-center items-center gap-2">
      {isLoading ? null : (
        <Avatar>
          <AvatarImage src={user?.profile_picture ?? defaultAvatar} />
          <AvatarFallback>
            {user?.first_name +
              " " +
              user?.last_name?.split(" ").map((n) => n[0].toUpperCase())}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
