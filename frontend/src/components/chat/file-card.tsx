import { XIcon } from "lucide-react";
import { Button } from "../ui/button";
import type { UploadFile } from "@/lib/types";

interface Props {
  file: UploadFile;
  handleRemove: () => void;
}
export function FileCard({ file, handleRemove }: Props) {
  function displayPreview() {
    if (file.file.type.startsWith("image/")) {
      return (
        <img
          src={file.dataUrl}
          alt={file.file.name}
          className="h-35 rounded-md w-40"
        />
      );
    }
    if (file.file.type.startsWith("video/")) {
      return (
        <video src={file.dataUrl} controls className="h-35 rounded-md w-40" />
      );
    }
    if (file.file.type.startsWith("audio/")) {
      return (
        <audio src={file.dataUrl} controls className="h-35 rounded-md w-40" />
      );
    }
    if (file.file.type.startsWith("application/pdf")) {
      return <img src={"/mime/pdf.png"} className="h-35 rounded-md w-40" />;
    }
    return <img src={"/mime/other.png"} className="h-35 rounded-md w-40" />;
  }
  return (
    <div className="h-35 w-40 relative">
      <div className="absolute z-10 right-1 top-1">
        <Button
          variant={"destructive"}
          className="h-5 w-5"
          size={"icon"}
          onClick={handleRemove}
        >
          <XIcon />
        </Button>
      </div>
      {displayPreview()}
    </div>
  );
}
