import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module.js";
import { ChatsModule } from "./chats/chats.module.js";
import { UsersModule } from "./users/users.module.js";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ChatsModule,
    SubscriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
