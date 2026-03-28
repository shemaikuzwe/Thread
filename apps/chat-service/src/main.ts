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
      //remove the protocol from the url
      url: env.SERVICE_URL.replace(/^[a-zA-Z+\-.]+:\/\//, ''),
      package: "chat",
      protoPath: join(__dirname, "../chat.proto"),
    },
  });
}

bootstrap();
