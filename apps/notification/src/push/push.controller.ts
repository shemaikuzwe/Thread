import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { PushService } from "./push.service";
import type { ChatPayload } from "src/@types";

@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {}
  @MessagePattern("chat-notification")
  async sendChatNotification(@Payload() data: ChatPayload, @Ctx() ctx: RmqContext) {
    console.log("ctx", ctx.getPattern());
    console.log("data", data);
    await this.pushService.sendChatNotification(data);
  }
}
