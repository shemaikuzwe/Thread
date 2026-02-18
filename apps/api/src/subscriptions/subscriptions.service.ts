import { Injectable } from "@nestjs/common";
import webpush from "web-push";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";

@Injectable()
export class SubscriptionsService {
  constructor(
    private usersService: UsersService,
    private config: ConfigService,
  ) {
    webpush.setVapidDetails(
      `mailto:${this.config.get("VAPID_EMAIL", "test@test.com")}`,
      this.config.get("VAPID_PUBLIC_KEY")!,
      this.config.get("VAPID_PRIVATE_KEY")!,
    );
  }

  async subscribe(userId: string, sub: Record<string, unknown>, endpoint: string) {
    return this.usersService.addSubscription(userId, sub, endpoint);
  }

  async unsubscribe(endpoint: string) {
    return this.usersService.removeSubscription(endpoint);
  }

  async sendNotification(userId: string, payload: { title: string; body: string; data?: any }) {
    const subscriptions = await this.usersService.getSubscriptions(userId);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub.sub as any, JSON.stringify(payload)).catch((err) => {
          if (err.statusCode === 410) this.usersService.removeSubscription(sub.endpoint);
          throw err;
        }),
      ),
    );

    return results;
  }

  async testNotification(userId: string) {
    return this.sendNotification(userId, {
      title: "Test Notification",
      body: "This is a test notification from Thread!",
    });
  }
}
