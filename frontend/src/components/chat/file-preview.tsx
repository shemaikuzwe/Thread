import type { Message, MessageFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { VideoPlayer } from "../ui/video";
import { Button } from "../ui/button";
import { DownloadIcon, FullscreenIcon, MinimizeIcon, XIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatAvatar from "../ui/user-avatar";
import { formatDate, isValid } from "date-fns";
import PDF from "../ui/pdf";
import { AudioPlayer } from "../ui/audio";

interface Props {
  file: MessageFile;
  className?: string;
  message: Message;
}
export function FilePreview({ file, className = "h-60 w-55 rounded-md", message }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  function displayPreview(className: string, open: boolean = false, isPreview: boolean = false) {
    if (file.type.startsWith("image/")) {
      return <img src={file.url} alt={file.name} className={cn(className)} />;
    }
    if (file.type.startsWith("video/")) {
      return (
        <VideoPlayer
          src={file.url}
          title={file.name}
          isPreview={isPreview}
          className={className}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      );
    }
    if (file.type.startsWith("audio/")) {
      return <AudioPlayer audioUrl={file.url} />;
    }
    if (file.type.startsWith("application/pdf")) {
      return <PDF file={file} onDownloadClick={handleDownload} open={open} className={className} />;
    }
    return <img src="/mime/other.png" alt={file.name} className={cn(className)} />;
  }

  const toogleFullScreen = () => {
    if (!document.fullscreenElement) {
      divRef.current?.requestFullscreen().then(() => {
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };
  const handleDownload = async () => {
    try {
      const res = await fetch(file.url);
      if (!res.ok) {
        throw new Error("failed to get file url");
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.log(err);
      toast.error("failed to download");
    }
  };
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      } else {
        setIsFullScreen(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);
  return (
    <Dialog
      onOpenChange={(open) => {
        if (file.type.startsWith("video/")) {
          if (open) {
            //To enable auto play on dialog open
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
          }
        }
      }}
    >
      <DialogTrigger>{displayPreview(className, false, true)}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn("max-w-full mb-5 h-full bg-background/50 ")}
      >
        <DialogHeader className="flex items-start  flex-row justify-between w-full px-4">
          <div className="flex gap-2 justify-center items-start">
            <div className="w-10 h-10">
              <ChatAvatar type="user" user={message.from} />
            </div>
            <div>
              <DialogTitle className="font-medium text-sm">
                {message.from.first_name + " " + message.from.last_name}
              </DialogTitle>
              <span className="text-sm text-muted-foreground">
                {message.created_at && isValid(new Date(message.created_at))
                  ? formatDate(new Date(message.created_at), "HH:mm")
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button variant={"outline"} onClick={toogleFullScreen}>
                  <FullscreenIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Full Screen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant={"outline"} onClick={handleDownload}>
                  <DownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogClose asChild>
                  <Button variant={"outline"}>
                    <XIcon />
                  </Button>
                </DialogClose>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        <div ref={divRef} className="flex justify-center items-center">
          {displayPreview(`rounded-md   ${isFullScreen ? "h-full w-full" : "h-130 w-230"}`, true)}
          {isFullScreen && (
            <div className={"absolute top-10 right-25 flex gap-2"}>
              <Button onClick={toogleFullScreen} variant={"secondary"} title="Exit Fullscreen">
                <MinimizeIcon className="w-full h-full" />
              </Button>
              <Button variant={"secondary"} onClick={handleDownload} title="Download">
                <DownloadIcon />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
