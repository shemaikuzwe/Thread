import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { env } from "src/lib/env";

async function bootstrap() {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [env.RABBITMQ_URL],
      queue: "chat_queue",
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.listen();
}

bootstrap();
