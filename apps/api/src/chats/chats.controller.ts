import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ChatsService } from "./chats.service";
import {
  Session,
  type UserSession,
} from "@thallesp/nestjs-better-auth";

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getChats(@Session() session: UserSession, @Query("search") search?: string) {
    const userId = session?.user?.id;
    return this.chatsService.getChats(userId, search);
  }

  @Get("unread")
  unread(@Session() session: UserSession) {
    const userId = session?.user?.id;
    return this.chatsService.unread(userId);
  }

  @Post()
  create(
    @Session() session: UserSession,
    @Body() body: { name: string; description: string },
  ) {
    const userId = session?.user?.id;
    return this.chatsService.createChannel(userId, body);
  }

  @Post("dm")
  createDM(@Session() session: UserSession, @Body() body: { userId: string }) {
    const userId = session?.user?.id;
    return this.chatsService.createDM(userId, body.userId);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.chatsService.getChatById(id);
  }

  @Get(":id/join")
  join(@Param("id") id: string, @Session() session: UserSession) {
    const userId = session?.user?.id;
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
