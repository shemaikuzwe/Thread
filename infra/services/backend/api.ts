import * as p from "@pulumi/pulumi";
import * as random from "@pulumi/random";
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
  apiUrlArn: p.Input<string>;
  rdsSsmArn: p.Input<string>;
  clientUrlArn: p.Input<string>;
  valkeySsmArn: p.Input<string>;
};

export class ThreadApi extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;
  public readonly serviceName: p.Output<string>;
  public readonly imageRepoUrl: p.Output<string>;

  constructor(
    { product, port, cluster, taskRoleArn, executionRoleArn, vpc, ...props }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-api`, "api", {}, opts);

    const randomSecret = new random.RandomUuid4("better_auth_secret").result;
    const { arn: betterAuthSecretArn } = new ThreadSsmParameter(
      { name: "better_auth_secret", product, value: randomSecret, isSecret: true },
      { parent: this },
    );
    const { arn: googleClientIdArn } = new ThreadSsmParameter(
      { name: "google_client_id", product, value: "example", isSecret: true },
      { parent: this },
    );
    const { arn: googleClientSecretArn } = new ThreadSsmParameter(
      { name: "google_client_secret", product, value: "example", isSecret: true },
      { parent: this },
    );

    const { arn: githubClientIdArn } = new ThreadSsmParameter(
      { name: "github_client_id", product, value: "example", isSecret: true },
      { parent: this },
    );
    const { arn: githubClientSecretArn } = new ThreadSsmParameter(
      { name: "github_client_secret", product, value: "example", isSecret: true },
      { parent: this },
    );
    const { imageRepo } = new ThreadDockerImageRepo({ name: "api", product }, { parent: this });

    const ecs = new ThreadEcs(
      {
        name: "api",
        product,
        publicIp: true,
        port,
        cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        healthCheckLivePath: "/v1/health/live",
        healthCheckReadyPath: "/v1/health/ready",
        imageRepo,
        secrets: [
          { name: "DATABASE_URL", valueFrom: props.rdsSsmArn },
          { name: "GOOGLE_CLIENT_ID", valueFrom: googleClientIdArn },
          { name: "GOOGLE_CLIENT_SECRET", valueFrom: googleClientSecretArn },
          { name: "GITHUB_CLIENT_ID", valueFrom: githubClientIdArn },
          { name: "GITHUB_CLIENT_SECRET", valueFrom: githubClientSecretArn },
          { name: "API_BASE_URL", valueFrom: props.apiUrlArn },
          { name: "BETTER_AUTH_SECRET", valueFrom: betterAuthSecretArn },
          { name: "CLIENT_APP_URL", valueFrom: props.clientUrlArn },
          { name: "REDIS_URL", valueFrom: props.valkeySsmArn },
        ],
        environment: [{ name: "PORT", value: port.toString() }],
      },
      { parent: this },
    );

    this.lbUrl = ecs.lbUrl;
    this.serviceName = ecs.serviceName;
    this.imageRepoUrl = imageRepo;
    this.registerOutputs({
      lbUrl: this.lbUrl,
      serviceName: this.serviceName,
      imageRepoUrl: this.imageRepoUrl,
    });
  }
}
