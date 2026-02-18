import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
interface Props {
  className?: string;
}
export default function Logo({ className }: Props) {
  const router = useNavigate();
  return (
    <div
      onClick={() => router("/")}
      className={cn("cursor-pointer max-w-40 max-h-20 flex justify-start items-center", className)}
    >
      <img src={"/logo-dark.png"} alt="logo" width={200} height={100} />
    </div>
  );
}
