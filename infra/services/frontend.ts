import * as p from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { ThreadEcs } from "../resources/ecs";
import { ThreadDockerImageRepo } from "../resources/ecr";
import { VPC } from "../types";
interface Props {
  name: string;
  product: string;
  cluster: p.Input<string>;
  apiUrl: p.Input<string>;
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  vpc: VPC;
}
export class ThreadFrontend extends p.ComponentResource {
  constructor(
    { name, product, apiUrl, cluster, taskRoleArn, executionRoleArn, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);
    const { arn: wsServerUrlArn } = new aws.ssm.Parameter(
      `${product}-ws-server-url`,
      {
        name: `/${product}-/ws-server-url`,
        value: "http://localhost:8000",
        type: "SecureString",
      },
      { parent: this },
    );
    const { imageRepo } = new ThreadDockerImageRepo({ name: "web", product });
    new ThreadEcs(
      {
        name: "web",
        product,
        publicIp: true,
        port: 3000,
        cluster: cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        imageRepo: imageRepo,
        environment: [
          {
            name: "NEXT_PUBLIC_API_URL",
            value: apiUrl,
          },
        ],
        secrets:[{
          name:"NEXT_PUBLIC_WS_URL",
          valueFrom:wsServerUrlArn
        }]
      },
      { parent: this },
    );
  }
}
