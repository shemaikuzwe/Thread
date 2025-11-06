import type { MessageFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface Props {
  file: MessageFile;
  className?: string;
}
export function FilePreview({
  file,
  className = "h-55 w-55 rounded-md",
}: Props) {
  function displayPreview(className: string) {
    if (file.type.startsWith("image/")) {
      return <img src={file.url} alt={file.name} className={cn(className)} />;
    }
    if (file.type.startsWith("video/")) {
      return <video src={file.url} className={cn(className)} />;
    }
    if (file.type.startsWith("audio/")) {
      return <audio src={file.url} className={cn(className)} />;
    }
    if (file.type.startsWith("application/pdf")) {
      return (
        <iframe src={file.url} className={cn(className, "cursor-pointer")} />
      );
    }
    return (
      <img src="/mime/other.png" alt={file.name} className={cn(className)} />
    );
  }
  return (
    <Dialog>
      <DialogTrigger>{displayPreview(className)}</DialogTrigger>
      <DialogContent className="w-150 h-140">
        <DialogHeader>
          <DialogTitle className="text-md">{file.name}</DialogTitle>
        </DialogHeader>
        {displayPreview("h-118 w-full rounded-md")}
      </DialogContent>
    </Dialog>
  );
}
