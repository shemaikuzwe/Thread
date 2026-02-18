import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";

export const threadTypeEnum = pgEnum("thread_type", ["group", "dm"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture").notNull().default("/default.png"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const threads = pgTable("thread", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  isPrivate: boolean("is_private").default(false).notNull(),
  type: threadTypeEnum("type").default("group").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  (table) => ({
    pk: primaryKey({ columns: [table.threadId, table.userId] }),
  }),
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull().default(""),
  type: varchar("type", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lastRead = pgTable(
  "last_read",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade", onUpdate: "cascade" }),
    lastReadMessageId: uuid("last_read_message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserThread: unique("unique_user_thread").on(table.userId, table.threadId),
  }),
);

export const subscriptions = pgTable("subscription", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  sub: jsonb("sub").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
