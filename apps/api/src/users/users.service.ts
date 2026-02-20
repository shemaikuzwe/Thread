import { Injectable, NotFoundException } from "@nestjs/common";
import { db, subscriptions, users } from "@thread/db";
import { and, eq } from "drizzle-orm";

@Injectable()
export class UsersService {
  async findAll() {
    const users = await db.query.users.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      profile_picture: user.profilePicture,
    }));
  }

  async findById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      profile_picture: user.profilePicture,
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
