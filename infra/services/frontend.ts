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
  public readonly serviceName: p.Output<string>;
  public readonly imageRepoUrl: p.Output<string>;
  constructor(
    { name, product, cluster, taskRoleArn, executionRoleArn, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);

    const { imageRepo } = new ThreadDockerImageRepo({ name: "web", product });
    const ecs = new ThreadEcs(
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

    this.serviceName = ecs.serviceName;
    this.imageRepoUrl = imageRepo;
    this.registerOutputs({
      serviceName: this.serviceName,
      imageRepoUrl: this.imageRepoUrl,
    });
  }
}
