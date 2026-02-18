import { Body, Controller, Post } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { MessagesService } from "./messages.service.js";

@Controller("messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @CurrentUser("id") userId: string,
    @Body()
    body: {
      id: string;
      thread_id: string;
      message: string;
      files?: Array<{ name: string; url: string; type: string; size: number }>;
      created_at?: string;
      type?: string;
    },
  ) {
    return this.messagesService.create({ ...body, user_id: userId });
  }

  @Post("last-read")
  lastRead(@CurrentUser("id") userId: string, @Body() body: { thread_id: string; message: string }) {
    return this.messagesService.upsertLastRead({ ...body, user_id: userId });
  }
}
