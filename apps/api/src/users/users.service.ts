import { Injectable, NotFoundException } from "@nestjs/common";
import { db, subscriptions as subscriptionsTable } from "@thread/db";
import { and, eq } from "drizzle-orm";
import webpush from "web-push";

@Injectable()
export class UsersService {
  async findAll() {
    const users = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    }));
  }

  async findById(id: string) {
    const user = await db.query.user.findFirst({
      where: { id },
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async addSubscription(userId: string, sub: webpush.PushSubscription) {
    const endpoint = sub.endpoint;
    if (!endpoint) {
      throw new NotFoundException("endpoint is required");
    }

    await db.insert(subscriptionsTable).values({ userId, sub, endpoint });

    return "Subscription created successfully";
  }
  async sendNotification(title: string, message: string, userId: string) {
    const subscription = await db.query.subscriptions.findMany({
      where: {
        userId,
      },
    });
    if (!subscription.length)
      throw new NotFoundException("No subscription available");
    for (const sub of subscription) {
      await webpush.sendNotification(
        sub.sub as webpush.PushSubscription,
        JSON.stringify({
          title: title,
          body: message,
          icon: "/logo2.png",
        }),
      );
    }

    return { success: true };
  }
  async removeSubscription(userId: string, endpoint: string) {
    await db
      .delete(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, userId),
          eq(subscriptionsTable.endpoint, endpoint),
        ),
      );
    return "Subscription created successfully";
  }
}
