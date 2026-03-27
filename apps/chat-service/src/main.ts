import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { env } from "src/lib/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: env.SERVICE_URL,
      package: "chat",
      protoPath: join(__dirname, "../chat.proto"),
    },
  });

  await app.startAllMicroservices();
  await app.listen(env.PORT);
}

bootstrap();
