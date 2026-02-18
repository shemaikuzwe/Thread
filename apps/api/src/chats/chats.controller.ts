import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { ChatsService } from "./chats.service.js";

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getChats(@CurrentUser("id") userId: string, @Query("search") search?: string) {
    return this.chatsService.getChats(userId, search);
  }

  @Get("unread")
  unread(@CurrentUser("id") userId: string) {
    return this.chatsService.unread(userId);
  }

  @Post()
  create(@CurrentUser("id") userId: string, @Body() body: { name: string; description: string }) {
    return this.chatsService.createChannel(userId, body);
  }

  @Post("dm")
  createDM(@CurrentUser("id") userId: string, @Body() body: { user_id: string }) {
    return this.chatsService.createDM(userId, body.user_id);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.chatsService.getChatById(id);
  }

  @Get(":id/join")
  join(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.chatsService.join(id, userId);
  }

  @Get(":id/messages")
  messages(
    @Param("id") id: string,
    @Query("limit") limit = "15",
    @Query("cursor") cursor = "0",
  ) {
    return this.chatsService.getMessages(id, Number(limit), Number(cursor));
  }
}
