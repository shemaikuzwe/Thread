import { Body, Controller, Get, Headers, Param, Post, Query, Request } from "@nestjs/common";
import { ChatsService } from "./chats.service";

type AuthRequest = { user: { id: string } };

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getChats(@Request() req: AuthRequest, @Query("search") search?: string) {
    const userId = req.user.id;
    return this.chatsService.getChats(userId, search);
  }

  @Get("unread")
  unread(@Request() req: AuthRequest) {
    const userId = req.user.id;
    return this.chatsService.unread(userId);
  }

  @Post()
  create(@Request() req: AuthRequest, @Body() body: { name: string; description: string }) {
    const userId = req.user.id;
    return this.chatsService.createChannel(userId, body);
  }

  @Post("dm")
  createDM(@Request() req: AuthRequest, @Body() body: { user_id: string }) {
    const userId = req.user.id;
    return this.chatsService.createDM(userId, body.user_id);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.chatsService.getChatById(id);
  }

  @Get(":id/join")
  join(@Param("id") id: string, @Request() req: AuthRequest) {
    const userId = req.user.id;
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

  @Post("events")
  persistEvent(
    @Body() body: unknown,
    @Headers("x-chat-server-token") token?: string,
  ) {
    return this.chatsService.persistEvent(body, token);
  }

  @Get("internal/users/:id/threads")
  userThreads(
    @Param("id") userId: string,
    @Headers("x-chat-server-token") token?: string,
  ) {
    return this.chatsService.getUserThreadIds(userId, token);
  }
}
