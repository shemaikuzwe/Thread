import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PushModule } from "./push/push.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PushModule,
    HealthModule,
  ],
})
export class AppModule {}
