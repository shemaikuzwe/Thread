import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatsModule } from "./chats/chats.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChatsModule,
  ],
})
export class AppModule {}
