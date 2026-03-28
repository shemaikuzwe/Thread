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
  valkeySsmArn: p.Input<string>;
  clientUrlArn: p.Input<string>;
  apiUrlArn: p.Input<string>;
  chatServiceLbUrl: p.Input<string>;
};

export class ThreadWsServer extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;
  
  constructor(
    { product, port, cluster, taskRoleArn, executionRoleArn, vpc, ...props }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-ws-server`, "ws-server", {}, opts);

    const { imageRepo } = new ThreadDockerImageRepo(
      { name: "ws-server", product },
      { parent: this },
    );

    const { lbUrl } = new ThreadEcs(
      {
        name: "ws-server",
        product,
        publicIp: true,
        port,
        cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        imageRepo,
        secrets: [
          { name: "REDIS_URL", valueFrom: props.valkeySsmArn },
          { name: "CLIENT_APP_URL", valueFrom: props.clientUrlArn },
          { name: "API_URL", valueFrom: props.apiUrlArn },
        ],
        environment: [
          { name: "CHAT_SERVICE_URL", value: props.chatServiceLbUrl },
          { name: "PORT", value: port.toString() },
          { name: "GIN_MODE", value: "release" },
        ],
      },
      { parent: this },
    );

    this.lbUrl = lbUrl;
    this.registerOutputs({ lbUrl: this.lbUrl });
  }
}
