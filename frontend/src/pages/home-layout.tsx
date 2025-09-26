import Header from "@/components/header";
import { useSession } from "@/components/providers/session-provider";
import { Outlet, useNavigate } from "react-router-dom";

export default function HomeLayout() {
  const session = useSession();
  const navigate = useNavigate();
  if (session?.status === "authenticated") {
    navigate("/chat", { replace: true });
  }
  return (
    <div className="flex flex-col gap-2 min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
}
