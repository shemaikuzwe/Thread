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
import { Link } from "react-router-dom";

export default function User() {
  const session = useSession();
  if (!session || session.status === "pending" || !session.user) return null;
  const name = `${session.user?.first_name ?? ""} ${
    session?.user?.last_name ?? ""
  }`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex justify-center items-center gap-2">
          <Avatar>
            <AvatarImage src={session.user?.profilePicture ?? ""} />
            <AvatarFallback>
              {name?.split(" ").map((n) => n[0].toUpperCase()) ?? "U"}
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
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
