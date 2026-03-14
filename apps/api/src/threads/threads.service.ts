import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { db } from "@thread/db";
import { threads, threadUsers, messages, users, lastRead } from "@thread/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

@Injectable()
export class ThreadsService {
  async findByUserId(userId: string) {
    const userThreads = await db
      .select({ thread: threads, lastRead: lastRead })
      .from(threads)
      .innerJoin(threadUsers, eq(threads.id, threadUsers.threadId))
      .leftJoin(lastRead, and(eq(lastRead.threadId, threads.id), eq(lastRead.userId, userId)))
      .where(eq(threadUsers.userId, userId));

    return userThreads;
  }

  async findById(threadId: string, userId: string) {
    const [thread] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
    if (!thread) throw new NotFoundException("Thread not found");

    const membership = await db
      .select()
      .from(threadUsers)
      .where(and(eq(threadUsers.threadId, threadId), eq(threadUsers.userId, userId)))
      .limit(1);

    if (membership.length === 0) throw new ForbiddenException("Not a member of this thread");

    return thread;
  }

  async create(userId: string, dto: { name?: string; description?: string; isPrivate?: boolean; type: "group" | "dm" }) {
    const [thread] = await db
      .insert(threads)
      .values({
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate ?? false,
        type: dto.type,
      })
      .returning();

    await db.insert(threadUsers).values({ threadId: thread.id, userId });
    return thread;
  }

  async createDM(userId: string, otherUserId: string) {
    const existing = await db
      .select({ threadId: threadUsers.threadId })
      .from(threadUsers)
      .where(eq(threadUsers.userId, userId));

    const otherMember = await db
      .select({ threadId: threadUsers.threadId })
      .from(threadUsers)
      .where(eq(threadUsers.userId, otherUserId));

    const sharedThread = existing.find((e) => otherMember.some((o) => o.threadId === e.threadId));

    if (sharedThread) {
      const [thread] = await db.select().from(threads).where(eq(threads.id, sharedThread.threadId)).limit(1);
      return thread;
    }

    const [thread] = await db.insert(threads).values({ type: "dm" }).returning();

    await db.insert(threadUsers).values([
      { threadId: thread.id, userId },
      { threadId: thread.id, userId: otherUserId },
    ]);

    return thread;
  }

  async join(threadId: string, userId: string) {
    const thread = await this.findById(threadId, userId);
    if (thread.type === "dm") throw new ForbiddenException("Cannot join DM threads");

    await db.insert(threadUsers).values({ threadId, userId }).onConflictDoNothing();
    return thread;
  }

  async getMessages(threadId: string, userId: string, limit = 50, before?: string) {
    await this.findById(threadId, userId);

    const conditions = [eq(messages.threadId, threadId)];
    if (before) conditions.push(eq(messages.id, before));

    return db
      .select({ message: messages, user: users })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string) {
    const userThreads = await this.findByUserId(userId);
    const threadIds = userThreads.map((t) => t.thread.id);

    if (threadIds.length === 0) return [];

    const allMessages = await db
      .select({ threadId: messages.threadId, id: messages.id })
      .from(messages)
      .where(inArray(messages.threadId, threadIds));

    return userThreads.map((t) => ({
      threadId: t.thread.id,
      unreadCount: 0,
    }));
  }
}
