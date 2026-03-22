import * as p from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import { ThreadSsmParameter } from "../../resources/ssm";
import { ThreadRmq } from "../../resources/rmq";
import { ThreadRds } from "../../resources/rds";
import { ThreadValkey } from "../../resources/valkey";
import { VPC } from "../../types";
import { ThreadApi } from "./api";
import { ThreadChatService } from "./chat-service";
import { ThreadWsServer } from "./ws-server";
import { ThreadNotificationService } from "./notification-service";

type Props = {
  name: string;
  product: string;
  cluster: p.Input<string>;
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  vpc: VPC;
};

export class ThreadBackend extends p.ComponentResource {
  constructor(
    { cluster, taskRoleArn, executionRoleArn, name, product, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);

    // Shared SSM parameters
   
    const { arn: clientUrlArn } = new ThreadSsmParameter(
      { name: "client-url", product, value: "http://localhost:3000" },
      { parent: this },
    );
    const randomSecret = new random.RandomUuid4("better_auth_secret").result;
    const { arn: betterAuthSecretArn } = new ThreadSsmParameter(
      { name: "better_auth_secret", product, value: randomSecret, isSecret: true },
      { parent: this },
    );

    // Shared infrastructure
    const { rdsSsmArn } = new ThreadRds(
      { name: `${product}-rds`, product, dbName: product, vpc },
      { parent: this },
    );
    const { rmqSsmArn } = new ThreadRmq({ name: `${product}-rmq`, product, vpc }, { parent: this });
    const { valkeySsmArn } = new ThreadValkey(
      { name: `${product}-valkey`, product, vpc },
      { parent: this },
    );

    const PORT = 8000;
    const common = { product, port: PORT, cluster, taskRoleArn, executionRoleArn, vpc };

    // Services
    new ThreadApi(
      { ...common, rdsSsmArn, betterAuthSecretArn, clientUrlArn, valkeySsmArn },
      { parent: this },
    );

    const chatService = new ThreadChatService(
      { ...common, rdsSsmArn, clientUrlArn, rmqSsmArn },
      { parent: this },
    );

    new ThreadWsServer(
      {
        ...common,
        valkeySsmArn,
        clientUrlArn,
        betterAuthSecretArn,
        chatServiceLbUrl: chatService.lbUrl,
      },
      { parent: this },
    );

    new ThreadNotificationService(
      { ...common, rdsSsmArn, rmqSsmArn, clientUrlArn },
      { parent: this },
    );
  }
}
