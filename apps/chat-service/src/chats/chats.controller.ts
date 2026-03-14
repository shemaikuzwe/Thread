import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { Message, UserRequest, Response, ThreadResponse } from "src/chat-pb/chat";
import { ChatsService } from "./chats.service";
import { Metadata, type ServerUnaryCall } from "@grpc/grpc-js";

@Controller()
export class ChatsController {
  constructor(private readonly chatService: ChatsService) {}
  @GrpcMethod("ChatService")
  async saveMessage(
    data: Message,
    metadata: Metadata,
    call: ServerUnaryCall<Message, Response>,
  ): Promise<Response> {
    await this.chatService.saveMessage(data);

    return { message: "message saved successfully", status: 200 };
  }

  @GrpcMethod("ChatService")
  async getUserThreads(data: UserRequest): Promise<ThreadResponse> {
    const threadIds = await this.chatService.getUserThreadIds(data.userId);
    return { threads: threadIds };
  }
  @GrpcMethod("ChatService")
  async updateLastRead(data:Message): Promise<Response> {
    await this.chatService.updateLastRead(data);
    return { message: "last read updated successfully", status: 200 };
  }
}
