import * as p from "@pulumi/pulumi";
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
  clientUrlArn: p.Input<string>;
  rmqSsmArn: p.Input<string>;
};

export class ThreadChatService extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;

  constructor(
    { product, port, cluster, taskRoleArn, executionRoleArn, vpc, ...props }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-chat-service`, "chat-service", {}, opts);

    const { imageRepo } = new ThreadDockerImageRepo(
      { name: "chat-service", product },
      { parent: this },
    );

    const { lbUrl } = new ThreadEcs(
      {
        name: "chat-service",
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
          { name: "CLIENT_APP_URL", valueFrom: props.clientUrlArn },
          { name: "RABBITMQ_URL", valueFrom: props.rmqSsmArn },
        ],
        currentService: "SERVICE_URL",
        // environment: [{ name: "PORT", value: "8001" }],
      },
      { parent: this },
    );

    this.lbUrl = lbUrl;
    this.registerOutputs({ lbUrl: this.lbUrl });
  }
}
