import { XIcon } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  file: {
    url: string;
  };
  handleRemove: () => void;
}
export function FileCard({ file, handleRemove }: Props) {
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
      <img src={file.url} alt="file-preview" className="h-35 rounded-md w-40" />
    </div>
  );
}
