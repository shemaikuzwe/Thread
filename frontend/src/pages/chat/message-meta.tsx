import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { CheckCheckIcon, ClockIcon, InfoIcon } from "lucide-react";

interface Props {
  time: Date | string;
  status?: Status;
  className?: string;
}
export function Meta({ time, className, status = "SENT" }: Props) {
  const getMessageStatus = (status: Status) => {
    switch (status) {
      case "PENDING": {
        return <ClockIcon className="h-4 w-4" />;
      }
      case "FAILED": {
        return <InfoIcon className="h-4 w-4 text-destructive" />;
      }
      default:
        return <CheckCheckIcon className="h-4 w-4" />;
    }
  };
  return (
    <div className={cn("flex gap-1 justify-end", className)}>
      <span className="text-xs">{formatDate(new Date(time), "HH:mm")}</span>
      <span>{getMessageStatus(status)}</span>
    </div>
  );
}
