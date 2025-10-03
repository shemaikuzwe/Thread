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
import { useSession } from "../providers/session-provider";
import { Link, useNavigate } from "react-router-dom";
import defaultAvatar from "@/assets/default.png";
import { api } from "@/lib/axios";

export default function User() {
  const session = useSession();
  const navigate = useNavigate();
  if (!session || session.status === "pending" || !session.user) return null;
  const name = `${session.user?.first_name ?? ""} ${
    session?.user?.last_name ?? ""
  }`;
  console.log(session);
  const handleLogout = async () => {
    const res = await api.get("/auth/logout");
    if (res.status !== 200) {
      throw new Error("Something went wrong");
    }
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex justify-center items-center gap-2">
          <Avatar>
            <AvatarImage
              src={session.user?.profile_picture ?? defaultAvatar}
              className="rounded-full"
            />
            <AvatarFallback>
              {/*{name?.split(" ").map((n) => n[0].toUpperCase()) ?? "U"}*/}U
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{session.user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/settings?tab=profile`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/settings?tab=settings`}>Settings</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem><ThemeToggle /></DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
