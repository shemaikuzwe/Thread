import { Controller, Post, Delete, Body, Param } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  subscribe(
    @CurrentUser("id") userId: string,
    @Body() body: { sub: Record<string, unknown>; endpoint: string },
  ) {
    return this.subscriptionsService.subscribe(userId, body.sub, body.endpoint);
  }

  @Delete(":endpoint")
  unsubscribe(@Param("endpoint") endpoint: string) {
    return this.subscriptionsService.unsubscribe(decodeURIComponent(endpoint));
  }

  @Post("test")
  testNotification(@CurrentUser("id") userId: string) {
    return this.subscriptionsService.testNotification(userId);
  }
}
