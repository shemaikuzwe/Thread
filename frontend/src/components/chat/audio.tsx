import { Mic } from "lucide-react";
import { Button } from "../ui/button";

export default function AudioInput() {
  return (
    <Button variant={"secondary"}>
      <Mic className="h-10 w-10" />
    </Button>
  );
}
