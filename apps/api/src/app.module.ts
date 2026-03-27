import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatsModule } from "./chats/chats.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./lib/auth";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRoot({ auth, disableTrustedOriginsCors: true, }),
    UsersModule,
    ChatsModule,
    HealthModule,
  ],
})
export class AppModule {}
