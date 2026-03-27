import { defineRelationsPart } from "drizzle-orm";
import * as auth from "./auth";
import * as chat from "./chat";
export const relations = defineRelationsPart({ ...auth, ...chat }, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    subscriptions: r.many.subscriptions(),
    threadUsers: r.many.threadUsers(),
    messages: r.many.messages(),
    lastReads: r.many.lastRead(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  subscriptions: {
    user: r.one.user({
      from: r.subscriptions.userId,
      to: r.user.id,
    }),
  },
  threads: {
    threadUsers: r.many.threadUsers(),
    messages: r.many.messages(),
    lastReads: r.many.lastRead(),
  },
  threadUsers: {
    thread: r.one.threads({
      from: r.threadUsers.threadId,
      to: r.threads.id,
    }),
    user: r.one.user({
      from: r.threadUsers.userId,
      to: r.user.id,
    }),
  },
  messages: {
    thread: r.one.threads({
      from: r.messages.threadId,
      to: r.threads.id,
    }),
    user: r.one.user({
      from: r.messages.userId,
      to: r.user.id,
    }),
    files: r.many.files(),
    lastReads: r.many.lastRead(),
  },
  files: {
    message: r.one.messages({
      from: r.files.messageId,
      to: r.messages.id,
    }),
  },
  lastRead: {
    thread: r.one.threads({
      from: r.lastRead.threadId,
      to: r.threads.id,
    }),
    user: r.one.user({
      from: r.lastRead.userId,
      to: r.user.id,
    }),
    lastReadMessage: r.one.messages({
      from: r.lastRead.lastReadMessageId,
      to: r.messages.id,
    }),
  },
}));

export const authRelations = relations;
export const chatRelations = relations;
