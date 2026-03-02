import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  db,
  files,
  lastRead,
  messages as messagesTable,
  threads as threadsTable,
  threadUsers,
  user as usersTable,
} from "@thread/db";
import { and, count, desc, eq, gt, ilike, inArray, ne, or } from "drizzle-orm";

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
    const payload = raw as ChatEventPayload;
    const type = payload.type as ChatEventType;

    if (type === "MESSAGE") {
      if (!payload.id || !payload.thread_id || !payload.user_id) {
        throw new BadRequestException(
          "MESSAGE event missing id/thread_id/user_id",
        );
      }
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

        const fileRows = payloadFiles
          .filter((file) => file?.url && file?.type)
          .map((file) => ({
            url: file.url as string,
            name: file.name ?? "",
            type: file.type as string,
            size: Number(file.size ?? 0),
            messageId: payload.id,
          }));

        if (fileRows.length > 0) {
          await tx.insert(files).values(fileRows);
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

      await db
        .insert(lastRead)
        .values({
          threadId: payload.thread_id,
          userId: payload.user_id,
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

    return threads.map((t) => t.threadId);
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

    const membership = await db.query.threadUsers.findMany({
      where: { userId },
      columns: {
        threadId: true,
      },
    });

    const threadIds = [...new Set(membership.map((row) => row.threadId))];
    if (threadIds.length === 0) {
      return [];
    }

    const [threadRows, memberRows, latestMessages] = await Promise.all([
      db.query.threads.findMany({
        where: {
          id: {
            in: threadIds,
          },
        },
      }),
      db.query.threadUsers.findMany({
        where: {
          threadId: {
            in: threadIds,
          },
        },
        columns: {
          threadId: true,
          userId: true,
        },
      }),
      db.query.messages.findMany({
        where: {
          threadId: {
            in: threadIds,
          },
        },
        columns: {
          id: true,
          threadId: true,
          message: true,
          userId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const memberUserIds = [...new Set(memberRows.map((row) => row.userId))];
    const memberUsers =
      memberUserIds.length > 0
        ? await db.query.user.findMany({
            where: {
              id: {
                in: memberUserIds,
              },
            },
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          })
        : [];

    const userMap = new Map(memberUsers.map((user) => [user.id, user]));
    const usersByThread = new Map<
      string,
      Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture: string;
      }>
    >();

    for (const row of memberRows) {
      const user = userMap.get(row.userId);
      if (!user) {
        continue;
      }
      const current = usersByThread.get(row.threadId) ?? [];
      current.push({
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        profile_picture: user.profilePicture,
      });
      usersByThread.set(row.threadId, current);
    }

    const latestByThread = new Map<
      string,
      {
        id: string;
        message: string;
        user_id: string;
        created_at: Date;
      }
    >();

    for (const row of latestMessages) {
      if (!latestByThread.has(row.threadId)) {
        latestByThread.set(row.threadId, {
          id: row.id,
          message: row.message,
          user_id: row.userId,
          created_at: row.createdAt,
        });
      }
    }

    return threadRows.map((thread) => ({
      id: thread.id,
      name: thread.name,
      description: thread.description,
      is_private: thread.isPrivate,
      type: thread.type,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
      users: usersByThread.get(thread.id) ?? [],
      last_message: latestByThread.get(thread.id) ?? null,
    }));
  }

  async unread(userId: string) {
    const readRows = await db.query.lastRead.findMany({
      where: eq(lastRead.userId, userId),
      columns: {
        threadId: true,
        lastReadMessageId: true,
      },
    });

    const readMessageIds = [
      ...new Set(readRows.map((row) => row.lastReadMessageId)),
    ];
    const readMessages =
      readMessageIds.length > 0
        ? await db.query.messages.findMany({
            where: inArray(messagesTable.id, readMessageIds),
            columns: {
              id: true,
              createdAt: true,
            },
          })
        : [];

    const readMessageMap = new Map(
      readMessages.map((message) => [message.id, message.createdAt]),
    );

    const unread = await Promise.all(
      readRows.map(async (row) => {
        const since = readMessageMap.get(row.lastReadMessageId);
        if (!since) {
          return {
            last_read: row.lastReadMessageId,
            thread_id: row.threadId,
            unread_count: 0,
          };
        }

        const unreadRows = await db.query.messages.findMany({
          where: and(
            eq(messagesTable.threadId, row.threadId),
            ne(messagesTable.userId, userId),
            gt(messagesTable.createdAt, since),
          ),
          columns: {
            id: true,
          },
        });

        return {
          last_read: row.lastReadMessageId,
          thread_id: row.threadId,
          unread_count: unreadRows.length,
        };
      }),
    );

    return unread;
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
    const [userThreads, otherThreads] = await Promise.all([
      db.query.threadUsers.findMany({
        where: { userId },
        columns: { threadId: true },
      }),
      db.query.threadUsers.findMany({
        where: { userId: otherUserId },
        columns: { threadId: true },
      }),
    ]);

    const otherSet = new Set(otherThreads.map((row) => row.threadId));
    const candidateIds = userThreads
      .map((row) => row.threadId)
      .filter((threadId) => otherSet.has(threadId));

    if (candidateIds.length > 0) {
      const existing = await db.query.threads.findFirst({
        where: {
          id: {
            in: candidateIds,
          },
          type: "dm",
        },
        columns: {
          id: true,
        },
      });

      if (existing) {
        return { id: existing.id };
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
      .onConflictDoNothing();

    return { id: thread.id };
  }

  async getChatById(id: string) {
    const chat = await db.query.threads.findFirst({
      where: { id },
      with:{
        members:true,

      }
    });

    if (!chat) {
      throw new NotFoundException("chat not found");
    }

    const members = await db.query.threadUsers.findMany({
      where: { threadId: id },
      columns: {
        userId: true,
      },
  
    });

    const memberIds = [...new Set(members.map((member) => member.userId))];
    const memberUsers =
      memberIds.length > 0
        ? await db.query.user.findMany({
            where: {
              id: {
                in: memberIds,
              },
            },
            columns: {
              id: true,
               name: true,
               image: true,
              email: true,
            },
          })
        : [];

    return {
      id: chat.id,
      name: chat.name,
      description: chat.description,
      is_private: chat.isPrivate,
      type: chat.type,
      created_at: chat.createdAt,
      updated_at: chat.updatedAt,
      users: memberUsers.map((user) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
      })),
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
    const [messages, total] = await Promise.all([
      db.query.messages.findMany({
        where: { threadId: id },
        orderBy: {
          createdAt: "desc",
        },
        limit,
        offset: cursor,
        with: {
          files: true,
        },
      }),
      db
        .select({ id: count() })
        .from(messagesTable)
        .where(eq(messagesTable.threadId, id)),
    ]);

    const nextCursor = messages.length === limit ? cursor + limit : null;

    return {
      messages: messages.toReversed(),
      total: total.length,
      nextCursor,
    };
  }
}
