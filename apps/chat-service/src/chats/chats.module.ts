import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { env } from "src/lib/env";

@Module({
  controllers: [ChatsController],
  providers: [ChatsService],
  imports: [
    ClientsModule.register([
      {
        name: "notification-service",
        transport: Transport.RMQ,
        options: {
          urls: [env.RABBITMQ_URL],
          queue: "chat_queue",
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
})
export class ChatsModule {}
