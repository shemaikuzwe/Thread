import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "@thread/db";
import { users, subscriptions } from "@thread/db/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class UsersService {
  async findAll() {
    return db.select().from(users);
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async addSubscription(userId: string, sub: Record<string, unknown>, endpoint: string) {
    const existing = await db.select().from(subscriptions).where(eq(subscriptions.endpoint, endpoint)).limit(1);
    if (existing.length > 0) return existing[0];

    const [subscription] = await db
      .insert(subscriptions)
      .values({ userId, sub, endpoint })
      .returning();
    return subscription;
  }

  async removeSubscription(endpoint: string) {
    await db.delete(subscriptions).where(eq(subscriptions.endpoint, endpoint));
  }

  async getSubscriptions(userId: string) {
    return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }
}
