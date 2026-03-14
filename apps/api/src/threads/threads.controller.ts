import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ThreadsService } from "./threads.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateThreadDto, CreateDMDto, JoinThreadDto } from "./dto/thread.dto";

@Controller("chats")
export class ThreadsController {
  constructor(private threadsService: ThreadsService) {}

  @Get()
  findAll(@CurrentUser("id") userId: string) {
    return this.threadsService.findByUserId(userId);
  }

  @Get("unread")
  getUnread(@CurrentUser("id") userId: string) {
    return this.threadsService.getUnreadCount(userId);
  }

  @Post()
  create(@CurrentUser("id") userId: string, @Body() dto: CreateThreadDto) {
    return this.threadsService.create(userId, dto);
  }

  @Post("dm")
  createDM(@CurrentUser("id") userId: string, @Body() dto: CreateDMDto) {
    return this.threadsService.createDM(userId, dto.userId);
  }

  @Get(":id")
  findById(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.threadsService.findById(id, userId);
  }

  @Get(":id/join")
  join(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.threadsService.join(id, userId);
  }

  @Get(":id/messages")
  getMessages(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Query("limit") limit?: string,
    @Query("before") before?: string,
  ) {
    return this.threadsService.getMessages(id, userId, limit ? parseInt(limit) : 50, before);
  }
}
