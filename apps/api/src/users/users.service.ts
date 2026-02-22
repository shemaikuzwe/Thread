import { Injectable, NotFoundException } from "@nestjs/common";
import { db, subscriptions, user as userTable } from "@thread/db";
import { and, eq } from "drizzle-orm";

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
      where: eq(userTable.id, id),
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

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  }

  async addSubscription(userId: string, sub: unknown) {
    const endpoint = (sub as { endpoint?: string })?.endpoint;
    if (!endpoint) {
      throw new NotFoundException("endpoint is required");
    }

    await db
      .insert(subscriptions)
      .values({ userId, sub, endpoint })
      .onConflictDoUpdate({
        target: subscriptions.endpoint,
        set: { sub, userId, updatedAt: new Date() },
      });

    return "Subscription created successfully";
  }

  async removeSubscription(userId: string, endpoint: string) {
    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.endpoint, endpoint),
          eq(subscriptions.userId, userId),
        ),
      );
    return "Subscription created successfully";
  }
}
