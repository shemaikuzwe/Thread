import { Injectable, NotFoundException } from "@nestjs/common";
import { db, users } from "@thread/db";
import { eq, sql } from "drizzle-orm";

@Injectable()
export class UsersService {
  async findAll() {
    return db.select({
      id: users.id,
      first_name: users.firstName,
      last_name: users.lastName,
      email: users.email,
      profile_picture: users.profilePicture,
    }).from(users);
  }

  async findById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        first_name: users.firstName,
        last_name: users.lastName,
        email: users.email,
        profile_picture: users.profilePicture,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async addSubscription(userId: string, sub: unknown) {
    const endpoint = (sub as { endpoint?: string })?.endpoint;
    if (!endpoint) {
      throw new NotFoundException("endpoint is required");
    }

    await db.execute(sql`
      insert into subscription(user_id, sub, endpoint)
      values (${userId}::uuid, ${JSON.stringify(sub)}::jsonb, ${endpoint})
      on conflict (endpoint) do update set sub = excluded.sub, user_id = excluded.user_id, updated_at = now()
    `);

    return "Subscription created successfully";
  }

  async removeSubscription(userId: string, endpoint: string) {
    await db.execute(sql`
      delete from subscription where endpoint = ${endpoint} and user_id = ${userId}::uuid
    `);
    return "Subscription created successfully";
  }
}
