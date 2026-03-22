import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";
import { DrizzleHealthIndicator } from "./drizzle.health";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@Controller("health")
@AllowAnonymous()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private drizzle: DrizzleHealthIndicator,
    private memory: MemoryHealthIndicator,
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
      () => this.memory.checkRSS("memory_rss", 150 * 1024 * 1024),
    ]);
  }
}
