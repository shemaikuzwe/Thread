import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, isValid } from "date-fns";
import { CheckCheckIcon, ClockIcon, InfoIcon } from "lucide-react";

interface Props {
  time: Date | string;
  status?: Status;
  className?: string;
  isOwn?: boolean;
}
export function Meta({ time, className, status = "SENT", isOwn }: Props) {
  const getMessageStatus = (status: Status) => {
    switch (status) {
      case "PENDING": {
        return <ClockIcon className="h-4 w-4 text-xs" />;
      }
      case "FAILED": {
        return <InfoIcon className="h-4 w-4 text-destructive text-xs" />;
      }
      default:
        return <CheckCheckIcon className="h-4 w-4 text-xs" />;
    }
  };
  const date = new Date(time);
  const isValidDate = isValid(date);
  return (
    <div className={cn("flex gap-1 justify-end", className)}>
      <span className="text-xs">{isValidDate ? formatDate(date, "HH:mm") : ""}</span>
      {isOwn && <span>{getMessageStatus(status)}</span>}
    </div>
  );
}
