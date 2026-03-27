import * as p from "@pulumi/pulumi";
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
  public readonly apiServiceName: p.Output<string>;
  public readonly chatServiceName: p.Output<string>;
  public readonly wsServerServiceName: p.Output<string>;
  public readonly notificationServiceName: p.Output<string>;
  constructor(
    { cluster, taskRoleArn, executionRoleArn, name, product, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);

    // Shared SSM parameters
    const { arn: apiUrlArn } = new ThreadSsmParameter(
      { name: "api-url", product, value: "http://localhost:8000" },
      { parent: this },
    );
    const { arn: clientUrlArn } = new ThreadSsmParameter(
      { name: "client-url", product, value: "http://localhost:3000" },
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
   const api= new ThreadApi(
      { ...common, rdsSsmArn, apiUrlArn, clientUrlArn, valkeySsmArn },
      { parent: this },
    );

    const chatService = new ThreadChatService(
      { ...common, rdsSsmArn, clientUrlArn, rmqSsmArn },
      { parent: this },
    );

    const wsServer = new ThreadWsServer(
      {
        ...common,
        valkeySsmArn,
        clientUrlArn,
        apiUrlArn,
        chatServiceLbUrl: chatService.lbUrl,
      },
      { parent: this },
    );

   const notificationService = new ThreadNotificationService(
      { ...common, rdsSsmArn, rmqSsmArn, clientUrlArn },
      { parent: this },
    );
   this.apiServiceName = api.apiServiceName;
   this.chatServiceName = chatService.chatServiceName;
   this.wsServerServiceName = wsServer.wsServerServiceName;
   this.notificationServiceName = notificationService.notificationServiceName;

    this.registerOutputs({
      apiServiceName: this.apiServiceName,
      chatServiceName: this.chatServiceName,
      wsServerServiceName: this.wsServerServiceName,
      notificationServiceName: this.notificationServiceName,
    });
  }
}
