import { Injectable } from "@nestjs/common";
import { db } from "@thread/db";
import { messages, lastRead } from "@thread/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateMessageDto, UpdateLastReadDto } from "./dto/message.dto";

@Injectable()
export class MessagesService {
  async create(userId: string, dto: CreateMessageDto) {
    const [message] = await db
      .insert(messages)
      .values({
        threadId: dto.threadId,
        userId,
        message: dto.message,
      })
      .returning();
    return message;
  }

  async updateLastRead(userId: string, threadId: string, dto: UpdateLastReadDto) {
    const existing = await db
      .select()
      .from(lastRead)
      .where(and(eq(lastRead.userId, userId), eq(lastRead.threadId, threadId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(lastRead)
        .set({ lastReadMessageId: dto.messageId })
        .where(eq(lastRead.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(lastRead)
      .values({ userId, threadId, lastReadMessageId: dto.messageId })
      .returning();
    return created;
  }
}
