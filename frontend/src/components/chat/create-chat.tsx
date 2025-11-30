import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { createChatSchema, type CreateChatData } from "@/lib/schema.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form.tsx";
import { api } from "@/lib/axios.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "../ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";

export function CreateThread({
  className,
  onClose,
}: {
  onClose: () => void;
  className?: string;
}) {
  const form = useForm<CreateChatData>({
    resolver: zodResolver(createChatSchema),
  });
  const queryClient = useQueryClient();

  const handleSubmit = async (data: CreateChatData) => {
    try {
      const res = await api.post("/chats", data);
      if (res.status !== 201) {
        throw new Error(res.data.message || "Failed to create chat");
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      onClose();
      // TODO: Redirect to chat page
    } catch (err) {
      console.error(err);
      onClose();
      // TODO: add toast
    }
  };
  return (
    <div className={cn(className)}>
      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter thread name" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter channel description"
                      rows={2}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
