import { useSession } from "@/components/providers/session-provider";
import { Outlet, useNavigate } from "react-router-dom";

export default function ChatLayout() {
  const session = useSession();
  const navigate = useNavigate();
  if (!session || session.status === "un_authenticated") {
    navigate("/login", { replace: true });
  }
  return <Outlet />;
}
