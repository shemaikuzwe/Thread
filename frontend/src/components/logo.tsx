import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import Logo2 from "@/assets/logo2.png";
interface Props {
  className?: string;
}
export default function Logo({ className }: Props) {
  const router = useNavigate();
  return (
    <div
      onClick={() => router("/")}
      className={cn(
        "cursor-pointer max-w-40 max-h-12 flex justify-start items-center",
        className,
      )}
    >
      <img src={Logo2} alt="logo" width={50} />
      <span className="font-bold text-xl">Instant</span>
    </div>
  );
}
