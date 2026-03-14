import { Inject, Injectable } from "@nestjs/common";
import { db } from "@thread/db";
import { Message } from "src/chat-pb/chat";
import {
  messages as messageTable,
  files as filesTable,
  lastRead as lastReadTable,
} from "@thread/db";
import { ClientProxy } from "@nestjs/microservices";
@Injectable()
export class ChatsService {
  constructor(@Inject("notification-service") private readonly notificationService: ClientProxy) {}
  async saveMessage(message: Message) {
    console.log(message);
    await db.insert(messageTable).values({
      message: message.message,
      threadId: message.threadId,
      id: message.id,
      userId: message.userId,
    });
    const files = message?.files
      ?.filter((file) => file?.url && file?.type)
      .map((file) => ({
        url: file.url as string,
        name: file.name ?? "",
        type: file.type as string,
        size: Number(file.size ?? 0),
        messageId: message.id,
      }));

    if (files?.length > 0) {
      await db.insert(filesTable).values(files);
    }
    this.notificationService.emit("chat-notification", {
      message: message.message,
      threadId: message.threadId,
      userId: message.userId,
    });
  }

  async updateLastRead(message: Message) {
    await db
      .insert(lastReadTable)
      .values({
        threadId: message.threadId,
        userId: message.userId,
        lastReadMessageId: message.message,
      })
      .onConflictDoUpdate({
        target: [lastReadTable.threadId, lastReadTable.userId],
        set: {
          lastReadMessageId: message.message,
        },
      });
  }

  async getUserThreadIds(userId: string) {
    const threads = await db.query.threadUsers.findMany({
      where: { userId },
      columns: {
        threadId: true,
      },
    });

    return threads.map((thread) => thread.threadId);
  }
}
