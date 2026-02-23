import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  db,
  files as filesTable,
  lastRead as lastReadTable,
  messages as messagesTable,
  threads as threadsTable,
  threadUsers,
  user as userTable,
} from "@thread/db";
import { and, count, desc, eq, gt, ilike, inArray, ne } from "drizzle-orm";

type ChatEventType = "MESSAGE" | "UPDATE_LAST_READ";

type ChatEventPayload = {
  id: string;
  message?: unknown;
  thread_id: string;
  user_id: string;
  type: ChatEventType;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number;
  }>;
};

@Injectable()
export class ChatsService {
  private async ensureThreadMembership(threadId: string, userId: string) {
    const membership = await db.query.threadUsers.findFirst({
      where: and(eq(threadUsers.threadId, threadId), eq(threadUsers.userId, userId)),
      columns: { threadId: true },
    });

    if (!membership) {
      throw new ForbiddenException("User is not a member of this thread");
    }
  }

  private validateInternalToken(token?: string) {
    const expected = process.env.CHAT_SERVER_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException("Invalid chat-server token");
    }
  }

  async persistEvent(data: unknown, token?: string) {
    this.validateInternalToken(token);

    if (!data || typeof data !== "object") {
      throw new BadRequestException("Invalid event payload");
    }
    const payload = data as ChatEventPayload;
    const type = payload.type as ChatEventType;

    if (type === "MESSAGE") {
      if (!payload.id || !payload.thread_id || !payload.user_id) {
        throw new BadRequestException(
          "MESSAGE event missing id/thread_id/user_id",
        );
      }
      await this.ensureThreadMembership(payload.thread_id, payload.user_id);
      const text = typeof payload.message === "string" ? payload.message : "";
      const payloadFiles = Array.isArray(payload.files) ? payload.files : [];

      await db.transaction(async (tx) => {
        await tx
          .insert(messagesTable)
          .values({
            id: payload.id,
            threadId: payload.thread_id,
            userId: payload.user_id,
            message: text,
          })
          .onConflictDoNothing({ target: messagesTable.id });

        const files = payloadFiles
          .filter((file) => file?.url && file?.type)
          .map((file) => ({
            url: file.url as string,
            name: file.name ?? "",
            type: file.type as string,
            size: Number(file.size ?? 0),
            messageId: payload.id,
          }));

        if (files.length > 0) {
          await tx.insert(filesTable).values(files);
        }
      });

      return { ok: true };
    }

    if (type === "UPDATE_LAST_READ") {
      if (
        !payload.thread_id ||
        !payload.user_id ||
        typeof payload.message !== "string"
      ) {
        throw new BadRequestException("UPDATE_LAST_READ event missing fields");
      }
      await this.ensureThreadMembership(payload.thread_id, payload.user_id);

      await db
        .insert(lastReadTable)
        .values({
          threadId: payload.thread_id,
          userId: payload.user_id,
          lastReadMessageId: payload.message,
        })
        .onConflictDoUpdate({
          target: [lastReadTable.userId, lastReadTable.threadId],
          set: {
            lastReadMessageId: payload.message,
            updatedAt: new Date(),
          },
        });

      return { ok: true };
    }

    return { ok: true };
  }

  async getUserThreadIds(userId: string, token?: string) {
    this.validateInternalToken(token);

    const threads = await db.query.threadUsers.findMany({
      where: eq(threadUsers.userId, userId),
      columns: {
        threadId: true,
      },
    });

    return threads.map((t) => t.threadId);
  }

  async getChats(userId: string, search?: string) {
    if (search) {
      const pattern = `%${search.trim()}%`;

      const [groups, users] = await Promise.all([
        db.query.threads.findMany({
          where: and(
            ilike(threadsTable.name, pattern),
            eq(threadsTable.isPrivate, false),
          ),
          columns: { id: true, name: true },
        }),
        db.query.user.findMany({
          where: ilike(userTable.name, pattern),
          columns: { id: true, name: true },
        }),
      ]);

      return [
        ...groups.map((t) => ({
          id: t.id,
          name: t.name,
          type: "group" as const,
        })),
        ...users.map((u) => ({
          id: u.id,
          name: u.name,
          type: "user" as const,
        })),
      ];
    }

    const userThreads = await db.query.threadUsers.findMany({
      where: eq(threadUsers.userId, userId),
      with: {
        thread: {
          with: {
            threadUsers: {
              with: {
                user: true,
              },
            },
            messages: {
              orderBy: [desc(messagesTable.createdAt)],
              limit: 1,
            },
          },
        },
      },
    });

    return userThreads
      .filter((ut) => !!ut.thread)
      .map(({ thread }) => {
        const lastMessage = thread.messages[0];

        return {
          id: thread.id,
          name: thread.name,
          description: thread.description,
          is_private: thread.isPrivate,
          type: thread.type,
          created_at: thread.createdAt,
          updated_at: thread.updatedAt,
          users: thread.threadUsers.map((tu) => ({
            id: tu.user.id,
            name: tu.user.name,
            email: tu.user.email,
            image: tu.user.image,
          })),
          last_message: lastMessage
            ? {
              id: lastMessage.id,
              message: lastMessage.message,
              user_id: lastMessage.userId,
              created_at: lastMessage.createdAt,
            }
            : null,
        };
      });
  }

  async unread(userId: string) {
    const readRows = await db.query.lastRead.findMany({
      where: eq(lastReadTable.userId, userId),
      with: {
        lastReadMessage: true,
      },
    });

    const results = await Promise.all(
      readRows.map(async (row) => {
        const since = row.lastReadMessage?.createdAt;
        if (!since) {
          return {
            last_read: row.lastReadMessageId,
            thread_id: row.threadId,
            unread_count: 0,
          };
        }
        const unreadCount = await db
          .select({ count: count() })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.threadId, row.threadId),
              ne(messagesTable.userId, userId),
              gt(messagesTable.createdAt, since),
            ),
          );
        return {
          last_read: row.lastReadMessageId,
          thread_id: row.threadId,
          unread_count: unreadCount[0]?.count ?? 0,
        };
      }),
    );

    return results;
  }

  async createChannel(
    userId: string,
    body: { name: string; description: string },
  ) {
    const [thread] = await db
      .insert(threadsTable)
      .values({
        name: body.name,
        description: body.description,
        type: "group",
      })
      .returning({ id: threadsTable.id });

    await db.insert(threadUsers).values({
      threadId: thread.id,
      userId,
    });

    return thread.id;
  }

  async createDM(userId: string, otherUserId: string) {
    const userThreads = await db.query.threadUsers.findMany({
      where: eq(threadUsers.userId, userId),
      with: {
        thread: true,
      },
    });

    const dmThreadIds = userThreads
      .filter((ut) => ut.thread?.type === "dm")
      .map((ut) => ut.threadId);

    if (dmThreadIds.length) {
      const existing = await db.query.threadUsers.findFirst({
        where: and(
          inArray(threadUsers.threadId, dmThreadIds),
          eq(threadUsers.userId, otherUserId),
        ),
      });
      if (existing) {
        return { id: existing.threadId };
      }
    }

    return await db.transaction(async (tx) => {
      const [thread] = await tx
        .insert(threadsTable)
        .values({ type: "dm" })
        .returning({ id: threadsTable.id });

      await tx.insert(threadUsers).values([
        { threadId: thread.id, userId },
        { threadId: thread.id, userId: otherUserId },
      ]);

      return { id: thread.id };
    });
  }

  async getChatById(id: string) {
    const chat = await db.query.threads.findFirst({
      where: eq(threadsTable.id, id),
      with: {
        threadUsers: {
          with: { user: true },
        },
      },
    });
    if (!chat) {
      throw new NotFoundException("chat not found");
    }
    return {
      id: chat.id,
      name: chat.name,
      description: chat.description,
      is_private: chat.isPrivate,
      type: chat.type,
      created_at: chat.createdAt,
      updated_at: chat.updatedAt,
      users: chat.threadUsers.flatMap((t) => ({
        id: t.user.id,
        name: t.user.name,
        email: t.user.email,
        image: t.user.image,
      })),
    };
  }

  async join(id: string, userId: string) {
    await db.insert(threadUsers).values({
      threadId: id,
      userId,
    });

    return { message: "Joined channel" };
  }

  async getMessages(id: string, limit: number, cursor: number, userId?: string) {
    if (!userId) {
      throw new UnauthorizedException("Unauthorized");
    }
    await this.ensureThreadMembership(id, userId);

    const [messages, total] = await Promise.all([
      db.query.messages.findMany({
        where: eq(messagesTable.threadId, id),
        orderBy: [desc(messagesTable.createdAt)],
        limit,
        offset: cursor,
        with: {
          user: true,
          files: true,
        },
      }),
      db
        .select({ count: count() })
        .from(messagesTable)
        .where(eq(messagesTable.threadId, id)),
    ]);

    const nextCursor = messages.length === limit ? cursor + limit : null;

    return {
      messages: messages.toReversed(),
      total: total[0]?.count ?? 0,
      nextCursor,
    };
  }
}
