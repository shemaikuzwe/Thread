"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
interface Props {
  className?: string;
}
export default function Logo({ className }: Props) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/")}
      className={cn(
        "cursor-pointer max-w-40 max-h-20 flex justify-start items-center",
        className,
      )}
    >
      <Image src={"/logo-dark.png"} alt="logo" width={200} height={100} />
    </div>
  );
}
