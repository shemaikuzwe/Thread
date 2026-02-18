import { Injectable } from "@nestjs/common";
import { db } from "@thread/db";
import { sql } from "drizzle-orm";
import Redis from "ioredis";

@Injectable()
export class MessagesService {
  private readonly publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

  async create(body: {
    id: string;
    thread_id: string;
    user_id: string;
    message: string;
    files?: Array<{ name: string; url: string; type: string; size: number }>;
    type?: string;
    created_at?: string;
  }) {
    await db.execute(sql`
      insert into messages(id, thread_id, user_id, message)
      values (${body.id}::uuid, ${body.thread_id}::uuid, ${body.user_id}::uuid, ${body.message})
    `);

    if (body.files?.length) {
      for (const file of body.files) {
        await db.execute(sql`
          insert into files(url, name, type, size, message_id)
          values (${file.url}, ${file.name}, ${file.type}, ${file.size}, ${body.id}::uuid)
        `);
      }
    }

    const userResult = await db.execute(sql`
      select id, email, first_name, last_name, profile_picture
      from users
      where id = ${body.user_id}::uuid
      limit 1
    `);
    const userRows = Array.isArray(userResult)
      ? userResult
      : ((userResult as { rows?: unknown[] }).rows ?? []);
    const user = (userRows[0] as
      | { id: string; email: string; first_name: string; last_name: string; profile_picture: string }
      | undefined) ?? {
      id: body.user_id,
      email: "",
      first_name: "",
      last_name: "",
      profile_picture: "",
    };

    await this.publisher.publish(
      "chat.events.v1",
      JSON.stringify({
        ...body,
        type: body.type || "MESSAGE",
        from: user,
      }),
    );

    return { id: body.id };
  }

  async upsertLastRead(body: { thread_id: string; user_id: string; message: string }) {
    await db.execute(sql`
      INSERT INTO last_read(thread_id,last_read_message_id,user_id)
      VALUES(${body.thread_id}::uuid,${body.message}::uuid,${body.user_id}::uuid)
      ON CONFLICT(user_id,thread_id)
      DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id,updated_at=now()
    `);

    await this.publisher.publish(
      "chat.events.v1",
      JSON.stringify({
        ...body,
        type: "UPDATE_LAST_READ",
      }),
    );

    return { ok: true };
  }
}
