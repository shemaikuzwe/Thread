import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "@thread/db";
import { sql } from "drizzle-orm";

function toRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

@Injectable()
export class ChatsService {
  async getChats(userId: string, search?: string) {
    if (search) {
      const pattern = `%${search.trim()}%`;
      const result = await db.execute(sql`
        SELECT t.id, t.name, 'group' as type
        FROM thread t
        WHERE t.name ILIKE ${pattern} AND t.is_private = false
        UNION
        SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name, 'user' as type
        FROM users u
        WHERE u.first_name ILIKE ${pattern} OR u.last_name ILIKE ${pattern}
      `);
      return toRows(result);
    }

    const result = await db.execute(sql`
      SELECT
        thread.*,
        json_agg(json_build_object(
            'id', users.id,
            'first_name', users.first_name,
            'last_name', users.last_name,
            'email', users.email,
            'profile_picture', users.profile_picture
        )) AS users,
        COALESCE(
            (
                SELECT json_build_object(
                    'id', m.id,
                    'message', m.message,
                    'user_id', m.user_id,
                    'created_at', m.created_at
                )
                FROM messages m
                WHERE m.thread_id = thread.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ),
            'null'
        )::json AS last_message
      FROM thread
      JOIN thread_user cu1 ON thread.id = cu1.thread_id
      JOIN thread_user cu2 ON thread.id = cu2.thread_id
      JOIN users ON cu2.user_id = users.id
      WHERE cu1.user_id = ${userId}::uuid
      GROUP BY thread.id
    `);
    return toRows(result);
  }

  async unread(userId: string) {
    const result = await db.execute(sql`
      SELECT
        l.last_read_message_id AS last_read,
        l.thread_id,
        (
          SELECT COUNT(m.id)
          FROM messages m
          WHERE
            m.thread_id = l.thread_id
            AND m.user_id != ${userId}::uuid
            AND m.created_at > lm.created_at
        ) AS unread_count
      FROM last_read l
      JOIN messages lm ON l.last_read_message_id = lm.id
      WHERE l.user_id = ${userId}::uuid
    `);
    return toRows(result);
  }

  async createChannel(userId: string, body: { name: string; description: string }) {
    const result = await db.execute(sql`
      INSERT INTO thread(name, description, type)
      VALUES (${body.name}, ${body.description}, 'group'::thread_type)
      RETURNING id
    `);

    const rows = toRows<{ id: string }>(result);
    const threadId = (rows[0] as { id: string }).id;

    await db.execute(sql`
      INSERT INTO thread_user(thread_id, user_id)
      VALUES (${threadId}::uuid, ${userId}::uuid)
    `);

    return threadId;
  }

  async createDM(userId: string, otherUserId: string) {
    const existing = toRows<{ id: string }>(await db.execute(sql`
      SELECT t.id
      FROM thread t
      JOIN thread_user tu1 ON t.id = tu1.thread_id
      JOIN thread_user tu2 ON t.id = tu2.thread_id
      WHERE t.type = 'dm'::thread_type
      AND tu1.user_id = ${userId}::uuid
      AND tu2.user_id = ${otherUserId}::uuid
      LIMIT 1
    `));

    if (existing.length) {
      return { id: (existing[0] as { id: string }).id };
    }

    const rows = toRows<{ id: string }>(await db.execute(sql`
      INSERT INTO thread(type) VALUES ('dm'::thread_type) RETURNING id
    `));
    const id = (rows[0] as { id: string }).id;

    await db.execute(sql`
      INSERT INTO thread_user(thread_id, user_id)
      VALUES (${id}::uuid, ${userId}::uuid), (${id}::uuid, ${otherUserId}::uuid)
    `);

    return { id };
  }

  async getChatById(id: string) {
    const rows = toRows(await db.execute(sql`
      SELECT  thread.*,json_agg(json_build_object(
      'id', users.id,
      'first_name', users.first_name,
      'last_name', users.last_name,
      'profile_picture',users.profile_picture,
      'email', users.email)) AS users
      FROM thread INNER JOIN thread_user
      ON thread.id = thread_user.thread_id
      INNER JOIN users ON thread_user.user_id = users.id
      WHERE  thread.id = ${id}::uuid
      GROUP BY thread.id
    `));

    if (!rows.length) {
      throw new NotFoundException("chat not found");
    }

    return rows[0];
  }

  async join(id: string, userId: string) {
    await db.execute(sql`
      INSERT INTO thread_user(thread_id, user_id)
      VALUES (${id}::uuid, ${userId}::uuid)
      ON CONFLICT DO NOTHING
    `);
    return { message: "Joined channel" };
  }

  async getMessages(id: string, limit: number, cursor: number) {
    const messages = toRows(await db.execute(sql`
      SELECT
      m.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email,
        'profile_picture', u.profile_picture
      ) AS "from",
      COALESCE(
      json_arrayagg(
        json_build_object(
          'id', f.id,
          'url', f.url,
          'type', f.type,
          'size', f.size,
          'name',f.name
        )
        ORDER BY f.id
        ABSENT ON NULL
      ) FILTER (WHERE f.id IS NOT NULL),
      '[]'
      )::json
      AS files
    FROM messages m
    INNER JOIN users u ON m.user_id = u.id
    LEFT JOIN files f ON f.message_id = m.id
    WHERE m.thread_id = ${id}::uuid
    GROUP BY m.id, u.id
    ORDER BY m.created_at DESC
    LIMIT ${limit}
    OFFSET ${cursor}
    `));

    const totalRows = toRows<{ total: number }>(await db.execute(sql`
      SELECT COUNT(*)::int AS total FROM messages WHERE thread_id = ${id}::uuid
    `));

    const total = Number((totalRows[0] as { total: number }).total);
    const sorted = [...messages].reverse();
    const nextCursor = messages.length === limit ? cursor + limit : null;

    return { messages: sorted, total, nextCursor };
  }
}
