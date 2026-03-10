import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  db,
  files as filesTable,
  lastRead,
  messages as messagesTable,
  threads as threadsTable,
  threadUsers,
} from "@thread/db";
import { and, count, eq, gt, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

type ChatEventType = "MESSAGE" | "UPDATE_LAST_READ";

type ChatEventPayload = {
  id?: string;
  message?: unknown;
  thread_id?: string;
  user_id?: string;
  type?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number;
  }>;
};

@Injectable()
export class ChatsService {
  private validateInternalToken(token?: string) {
    const expected = process.env.CHAT_SERVER_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException("Invalid chat-server token");
    }
  }

  async persistEvent(raw: unknown, token?: string) {
    this.validateInternalToken(token);

    if (!raw || typeof raw !== "object") {
      throw new BadRequestException("Invalid event payload");
    }

    const payload = raw as any;
    const type = payload.type as ChatEventType;

    const id = payload.id;
    const threadId = payload.threadId || payload.thread_id;
    const userId = payload.userId || payload.user_id;

    if (type === "MESSAGE") {
      if (!id || !threadId || !userId) {
        throw new BadRequestException("MESSAGE event missing id/threadId/userId");
      }

      const text = typeof payload.message === "string" ? payload.message : "";
      const payloadFiles = Array.isArray(payload.files) ? payload.files : [];

      await db.transaction(async (tx) => {
        await tx
          .insert(messagesTable)
          .values({
            id: id,
            threadId: threadId,
            userId: userId,
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
      if (!threadId || !userId || typeof payload.message !== "string") {
        throw new BadRequestException("UPDATE_LAST_READ event missing fields");
      }

      await db
        .insert(lastRead)
        .values({
          threadId: threadId,
          userId: userId,
          lastReadMessageId: payload.message,
        })
        .onConflictDoUpdate({
          target: [lastRead.userId, lastRead.threadId],
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
