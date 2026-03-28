import * as p from "@pulumi/pulumi";
import { ThreadEcs } from "../resources/ecs";
import { ThreadDockerImageRepo } from "../resources/ecr";
import { VPC } from "../types";
interface Props {
  name: string;
  product: string;
  cluster: p.Input<string>;
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  vpc: VPC;
}
export class ThreadFrontend extends p.ComponentResource {
  
  constructor(
    { name, product, cluster, taskRoleArn, executionRoleArn, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);

    const { imageRepo } = new ThreadDockerImageRepo({ name: "web", product });
   const {serviceName}=   new ThreadEcs(
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
        healthCheckLivePath: "/api/health/live",
        healthCheckReadyPath: "/api/health/ready",
      },
      { parent: this },
    );
  }
}
