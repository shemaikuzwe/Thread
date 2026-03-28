import * as p from "@pulumi/pulumi";
import { ThreadSsmParameter } from "../../resources/ssm";
import { ThreadDockerImageRepo } from "../../resources/ecr";
import { ThreadEcs } from "../../resources/ecs";
import { VPC } from "../../types";

type Props = {
  product: string;
  port: number;
  cluster: p.Input<string>;
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  vpc: VPC;
  rdsSsmArn: p.Input<string>;
  rmqSsmArn: p.Input<string>;
  clientUrlArn: p.Input<string>;
};

export class ThreadNotificationService extends p.ComponentResource {
    
  constructor(
    { product, port, cluster, taskRoleArn, executionRoleArn, vpc, ...props }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-notification`, "notification-service", {}, opts);
    const { arn: vapidPrivateKeyArn } = new ThreadSsmParameter(
      { name: "vapid_private_key", product, value: "example", isSecret: true },
      { parent: this },
    );
    const { arn: vapidPublicKeyArn } = new ThreadSsmParameter(
      { name: "vapid_public_key", product, value: "example", isSecret: true },
      { parent: this },
    );
    const { imageRepo } = new ThreadDockerImageRepo(
      { name: "notification", product },
      { parent: this },
    );

    new ThreadEcs(
      {
        name: "notification",
        product,
        port,
        type: "network",
        cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        imageRepo,
        secrets: [
          { name: "DATABASE_URL", valueFrom: props.rdsSsmArn },
          { name: "RABBITMQ_URL", valueFrom: props.rmqSsmArn },
          { name: "CLIENT_APP_URL", valueFrom: props.clientUrlArn },
          { name: "VAPID_PUBLIC_KEY", valueFrom: vapidPublicKeyArn },
          { name: "VAPID_PRIVATE_KEY", valueFrom: vapidPrivateKeyArn },
        ],
        environment: [{ name: "PORT", value: port.toString() }],
      },
      { parent: this },
    );
  }
}
