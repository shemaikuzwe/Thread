import type { MessageFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { VideoPlayer } from "../ui/video";
import { Button } from "../ui/button";
import { DownloadIcon, FullscreenIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { set } from "zod";

interface Props {
  file: MessageFile;
  className?: string;
}
export function FilePreview({
  file,
  className = "h-55 w-55 rounded-md",
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  function displayPreview(className: string, open: boolean = false) {
    if (file.type.startsWith("image/")) {
      return <img src={file.url} alt={file.name} className={cn(className)} />;
    }
    if (file.type.startsWith("video/")) {
      return (
        <VideoPlayer
          src={file.url}
          title={file.name}
          controls={false}
          className={className}
        />
      );
    }
    if (file.type.startsWith("audio/")) {
      return <audio src={file.url} className={cn(className)} />;
    }
    if (file.type.startsWith("application/pdf")) {
      return open ? (
        <iframe src={file.url} className={cn(className)} />
      ) : (
        <div className={cn(className)}>
          <img
            src={"/mime/pdf.png"}
            alt="pdf image"
            className={cn("cursor-pointer w-full h-55")}
          />
        </div>
      );
    }
    return (
      <img src="/mime/other.png" alt={file.name} className={cn(className)} />
    );
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
    <Dialog>
      <DialogTrigger>{displayPreview(className)}</DialogTrigger>
      <DialogContent
        className={cn(
          "w-550 mb-5",
          isFullScreen ? "h-full" : "h-165 max-sm:w-full",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-md">{file.name}</DialogTitle>
        </DialogHeader>
        {
          <div ref={divRef}>
            {displayPreview(
              `w-full rounded-md ${isFullScreen ? "h-full" : "h-130"}`,
              true,
            )}
            {isFullScreen && (
              <div className={"absolute bottom-8 right-8 flex gap-2"}>
                <Button onClick={toogleFullScreen} title="Exit Fullscreen">
                  <FullscreenIcon className="w-full h-full" />
                </Button>

                <Button onClick={handleDownload} title="Downl">
                  <DownloadIcon />
                </Button>
              </div>
            )}
          </div>
        }

        <DialogFooter className="flex flex-row justify-end gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
