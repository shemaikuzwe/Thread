import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
} from "@nestjs/terminus";
import { DrizzleHealthIndicator } from "./drizzle.health";
import { Transport } from "@nestjs/microservices";
import { env } from "src/lib/env";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private drizzle: DrizzleHealthIndicator,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get("live")
  live() {
    return { status: "ok" };
  }

  @Get("ready")
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.drizzle.isHealthy("database"),
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
      () =>
        this.microservice.pingCheck("rabbitmq", {
          transport: Transport.RMQ,
          options: {
            urls: [env.RABBITMQ_URL],
          },
        }),
    ]);
  }
}
