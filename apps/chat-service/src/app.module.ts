import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatsModule } from "./chats/chats.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChatsModule,
    HealthModule,
  ],
})
export class AppModule {}
