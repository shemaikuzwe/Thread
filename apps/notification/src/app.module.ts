import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PushModule } from "./push/push.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PushModule,
  ],
})
export class AppModule {}
