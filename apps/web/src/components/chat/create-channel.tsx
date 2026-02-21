import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash } from "lucide-react";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (name: string) => void;
}

export const CreateChannelDialog = ({
  open,
  onOpenChange,
  onCreateChannel,
}: CreateChannelDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Channel name is required");
      return;
    }

    // Validate channel name format
    const channelNameRegex = /^[a-z0-9\-_]+$/;
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");

    if (!channelNameRegex.test(cleanName)) {
      setError(
        "Channel names can only contain lowercase letters, numbers, hyphens, and underscores",
      );
      return;
    }

    if (cleanName.length < 2) {
      setError("Channel name must be at least 2 characters long");
      return;
    }

    if (cleanName.length > 21) {
      setError("Channel name must be 21 characters or less");
      return;
    }

    onCreateChannel(cleanName);
    setName("");
    setError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName("");
    setError("");
    onOpenChange(false);
  };

  const previewName = name.trim().toLowerCase().replace(/\s+/g, "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. plan-budget"
                className="pl-9"
                maxLength={80}
              />
            </div>
            {previewName && (
              <p className="text-sm text-muted-foreground">
                Channel name will be: <span className="font-mono">#{previewName}</span>
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
