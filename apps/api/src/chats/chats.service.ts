import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  db,
  lastRead,
  messages as messagesTable,
  threads as threadsTable,
  threadUsers,
} from "@thread/db";
import { and, count, eq, gt, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

@Injectable()
export class ChatsService {
  private validateInternalToken(token?: string) {
    const expected = process.env.CHAT_SERVER_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException("Invalid chat-server token");
    }
  }

  async getUserThreadIds(userId: string, token?: string) {
    this.validateInternalToken(token);

    const threads = await db.query.threadUsers.findMany({
      where: { userId },
      columns: {
        threadId: true,
      },
    });

    return threads.map((thread) => thread.threadId);
  }

  async getChats(userId: string, search?: string) {
    if (search) {
      const pattern = `%${search.trim()}%`;
      const groups = await db.query.threads.findMany({
        where: {
          isPrivate: false,
          name: {
            ilike: pattern,
          },
        },
        columns: {
          id: true,
          name: true,
        },
      });

      const users = await db.query.user.findMany({
        where: {
          name: {
            ilike: pattern,
          },
        },
        columns: {
          id: true,
          name: true,
        },
      });

      return [
        ...groups.map((thread) => ({
          id: thread.id,
          name: thread.name,
          type: "group" as const,
        })),
        ...users.map((user) => ({
          id: user.id,
          name: user.name,
          type: "user" as const,
        })),
      ];
    }

    const threads = await db.query.threads.findMany({
      where: {
        threadUsers: {
          userId,
        },
      },
      with: {
        threadUsers: {
          columns: {
            userId: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return threads.map((t) => ({
      ...t,
      users: t.threadUsers.flatMap((tu) => tu.user),
    }));
  }

  async unread(userId: string) {
    const readMessage = alias(messagesTable, "readMessage");
    const unreadMessage = alias(messagesTable, "unreadMessage");

    const result = await db
      .select({
        threadId: lastRead.threadId,
        lastRead: lastRead.lastReadMessageId,
        unreadCount: count(unreadMessage.id),
      })
      .from(lastRead)
      .innerJoin(readMessage, eq(readMessage.id, lastRead.lastReadMessageId))
      .leftJoin(
        unreadMessage,
        and(
          eq(unreadMessage.threadId, lastRead.threadId),
          ne(unreadMessage.userId, userId),
          gt(unreadMessage.createdAt, readMessage.createdAt),
        ),
      )
      .where(eq(lastRead.userId, userId))
      .groupBy(lastRead.threadId, lastRead.lastReadMessageId);

    return result.map((r) => ({
      lastRead: r.lastRead,
      threadId: r.threadId,
      unreadCount: Number(r.unreadCount ?? 0),
    }));
  }

  async createChannel(userId: string, body: { name: string; description: string }) {
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

    return { id: thread.id };
  }

  async createDM(userId: string, otherUserId: string) {
    const memberships = await db.query.threadUsers.findMany({
      where: { userId },
      columns: {
        threadId: true,
      },
      with: {
        thread: {
          columns: {
            id: true,
            type: true,
          },
          with: {
            threadUsers: {
              columns: {
                userId: true,
              },
            },
          },
        },
      },
    });

    for (const membership of memberships) {
      const thread = membership.thread;
      if (!thread || thread.type !== "dm") {
        continue;
      }

      const hasOtherUser = thread.threadUsers.some(
        (threadUser) => threadUser.userId === otherUserId,
      );
      if (hasOtherUser) {
        return { id: thread.id };
      }
    }

    const [thread] = await db
      .insert(threadsTable)
      .values({ type: "dm" })
      .returning({ id: threadsTable.id });

    await db
      .insert(threadUsers)
      .values([
        {
          threadId: thread.id,
          userId,
        },
        {
          threadId: thread.id,
          userId: otherUserId,
        },
      ])
      // TODO: send bad exception
      .onConflictDoNothing();

    return { id: thread.id };
  }

  async getChatById(id: string) {
    const chat = await db.query.threads.findFirst({
      where: { id },
      with: {
        threadUsers: {
          columns: {
            userId: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException("chat not found");
    }

    return {
      ...chat,
      users: chat.threadUsers.flatMap((tu) => tu.user),
    };
  }

  async join(id: string, userId: string) {
    await db
      .insert(threadUsers)
      .values({
        threadId: id,
        userId,
      })
      .onConflictDoNothing();

    return { message: "Joined channel" };
  }

  async getMessages(id: string, limit: number, cursor: number) {
    const [messages, [{ total }]] = await Promise.all([
      db.query.messages.findMany({
        where: { threadId: id },
        orderBy: {
          createdAt: "desc",
        },
        limit,
        offset: cursor,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          files: true,
        },
      }),
      db.select({ total: count() }).from(messagesTable).where(eq(messagesTable.threadId, id)),
    ]);

    const nextCursor = messages.length === limit ? cursor + limit : null;

    return {
      messages: messages.toReversed(),
      total: Number(total),
      nextCursor,
    };
  }
}
