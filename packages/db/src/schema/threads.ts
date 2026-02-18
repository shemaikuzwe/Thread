import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const threadTypeEnum = pgEnum("thread_type", ["group", "dm"]);

export const threads = pgTable("thread", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  isPrivate: boolean("is_private").notNull().default(false),
  type: threadTypeEnum("type").notNull().default("group"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const threadUsers = pgTable(
  "thread_user",
  {
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [uniqueIndex("thread_user_pkey").on(table.threadId, table.userId)],
);

export const lastRead = pgTable(
  "last_read",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade", onUpdate: "cascade" }),
    lastReadMessageId: uuid("last_read_message_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("unique_user_thread").on(table.userId, table.threadId)],
);
