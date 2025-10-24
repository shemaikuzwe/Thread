import Header from "@/components/header";
import { Outlet } from "react-router";

export default function HomeLayout() {
  return (
    <div className="flex flex-col gap-2 min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
