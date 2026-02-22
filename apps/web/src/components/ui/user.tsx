import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { AvatarImage } from "./avatar";
import Link from "next/link";
const defaultAvatar = "/default.png";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import ThemeToggle from "../theme-toggle";

export default function User() {
  const session = useSession();
  const router = useRouter();
  if (session.isPending || !session.data?.user) return null;
  const user = session.data.user;
  const name = user.name;
  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex justify-center items-center gap-2">
          <Avatar>
            <AvatarImage
              src={user.image ?? defaultAvatar}
              className="rounded-full"
            />
            <AvatarFallback>
              {name?.split(" ").map((n) => n[0]?.toUpperCase()) ?? "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuItem asChild>
          <Link href={`/chat/settings?tab=profile`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/chat/settings?tab=settings`}>Settings</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem><ThemeToggle /></DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
