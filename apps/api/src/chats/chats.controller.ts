import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Public } from "../common/decorators/public.decorator.js";
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

  @Public()
  @Post("events")
  persistEvent(
    @Body() body: unknown,
    @Headers("x-chat-server-token") token?: string,
  ) {
    return this.chatsService.persistEvent(body, token);
  }

  @Public()
  @Get("internal/users/:id/threads")
  userThreads(
    @Param("id") userId: string,
    @Headers("x-chat-server-token") token?: string,
  ) {
    return this.chatsService.getUserThreadIds(userId, token);
  }
}
