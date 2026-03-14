import { pgTable, uuid, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { threads } from "./threads";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  name: text("name").notNull().default(""),
  type: varchar("type", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
