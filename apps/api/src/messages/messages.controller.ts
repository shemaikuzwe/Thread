import { Controller, Post, Body, Param } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateMessageDto, UpdateLastReadDto } from "./dto/message.dto";

@Controller("messages")
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(@CurrentUser("id") userId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(userId, dto);
  }

  @Post(":threadId/last-read")
  updateLastRead(
    @Param("threadId") threadId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateLastReadDto,
  ) {
    return this.messagesService.updateLastRead(userId, threadId, dto);
  }
}
