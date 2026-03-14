import { Injectable } from "@nestjs/common";
import { db } from "@thread/db";
import { ChatPayload } from "src/@types";
import { env } from "src/lib/env";
import webPush from "web-push";
@Injectable()
export class PushService {
  constructor() {
    webPush.setVapidDetails(env.CLIENT_APP_URL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  }
  private async sendNotification(
    subscription: webPush.PushSubscription,
    { title, message }: { title: string; message: string },
  ) {
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: title,
        body: message,
        icon: "/logo2.png",
      }),
    );
  }
  async sendChatNotification(data: ChatPayload) {
    const threadUsers = await db.query.threadUsers.findMany({
      where: {
        threadId: data.threadId,
        // NOT: {
        //   userId: data.userId,
        // },
      },
      with: {
        user: {
          with: {
            subscriptions: true,
          },
        },
      },
    });
    const thread = await db.query.threads.findFirst({
      where: {
        id: data.threadId,
      },
    });
    const subscriptions = threadUsers.flatMap((t) => t.user.subscriptions);
    await Promise.all(
      subscriptions.map((subscription) =>
        this.sendNotification(subscription.sub as webPush.PushSubscription, {
          title: thread?.name || "New message",
          message: data.message,
        }),
      ),
    );
  }
}
