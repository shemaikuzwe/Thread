import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.enableCors({
    origin: process.env.CLIENT_APP_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = Number(process.env.PORT || 8000);
  await app.listen(port);
}

bootstrap();
