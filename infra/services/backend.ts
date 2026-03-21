import * as p from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import { ThreadRmq } from "../resources/rmq";
import { ThreadRds } from "../resources/rds";
import { ThreadEcs } from "../resources/ecs";
import { ThreadValkey } from "../resources/valkey";
import { ThreadDockerImageRepo } from "../resources/ecr";
import { VPC } from "../types";
type Props = {
  name: string;
  product: string;
  cluster: p.Input<string>;
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  vpc: VPC;
};
export class ThreadBackend extends p.ComponentResource {
  public readonly apiUrl: p.Output<string>;
  constructor(
    { cluster, taskRoleArn, executionRoleArn, name, product, vpc }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}`, name, {}, opts);
    // ssm Parameters
    const { arn: apiUrlArn } = new aws.ssm.Parameter(
      `${product}-api-url`,
      {
        name: `/${product}-/api-url`,
        value: "http://localhost:8000",
        type: "SecureString",
      },
      { parent: this },
    );
    const { arn: clientUrlArn } = new aws.ssm.Parameter(
      `${product}-client-url`,
      {
        name: `/${product}-/client-url`,
        value: "http://localhost:3000",
        type: "SecureString",
      },
      { parent: this },
    );
    const { arn: googleClientIdArn } = new aws.ssm.Parameter(
      `${product}-google_client_id`,
      {
        name: `/${product}-/google_client_id`,
        value: "example",
        type: "SecureString",
      },
      { parent: this },
    );
    const { arn: googleClientSecretArn } = new aws.ssm.Parameter(
      `${product}-google_client_secret`,
      {
        name: `/${product}-/google_client_secret`,
        value: "example",
        type: "SecureString",
      },
      { parent: this },
    );
    const { arn: betterAuthSecretArn } = new aws.ssm.Parameter(
      `${product}-better_auth_secret`,
      {
        name: `/${product}-/better_auth_secret`,
        value: "example",
        type: "SecureString",
      },
      { parent: this },
    );

    const { rdsSsmArn } = new ThreadRds(
      { name: `${product}-rds`, product: product, dbName: product, vpc },
      { parent: this },
    );
    const { rmqSsmArn } = new ThreadRmq(
      { name: `${product}-rmq`, product: product, vpc: vpc },
      { parent: this },
    );
    const { valkeySsmArn } = new ThreadValkey(
      { name: `${product}-valkey`, product, vpc },
      { parent: this },
    );
    const API_PORT = 8000;
    const { imageRepo: apiImageRepo } = new ThreadDockerImageRepo(
      { name: "api", product },
      { parent: this },
    );
    const { imageRepo: wsServerImageRepo } = new ThreadDockerImageRepo(
      { name: "ws-server", product },
      { parent: this },
    );

    const { lbUrl: apiLbUrl } = new ThreadEcs(
      {
        name: "api",
        product,
        publicIp: true,
        port: API_PORT,
        cluster: cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        imageRepo: apiImageRepo,
        secrets: [
          {
            name: "DATABASE_URL",
            valueFrom: rdsSsmArn,
          },
          {
            name: "GOOGLE_CLIENT_ID",
            valueFrom: googleClientIdArn,
          },
          {
            name: "GOOGLE_CLIENT_SECRET",
            valueFrom: googleClientSecretArn,
          },
          {
            name: "BETTER_AUTH_URL",
            valueFrom: apiUrlArn,
          },
          {
            name: "BETTER_AUTH_SECRET",
            valueFrom: betterAuthSecretArn,
          },
          {
            name: "CLIENT_APP_URL",
            valueFrom: clientUrlArn,
          },
          {
            name: "REDIS_URL",
            valueFrom: valkeySsmArn,
          },
        ],
        environment: [
          {
            name: "PORT",
            value: API_PORT.toString(),
          },
        ],
      },
      { parent: this },
    );

    const { lbUrl: wsServerUrl } = new ThreadEcs(
      {
        name: "ws-server",
        product,
        publicIp: true,
        port: 8001,
        cluster: cluster,
        taskRoleArn,
        executionRoleArn,
        vpc,
        imageRepo: wsServerImageRepo,
        secrets: [
          {
            name: "REDIS_URL",
            valueFrom: valkeySsmArn,
          },
          {
            name: "CLIENT_APP_URL",
            valueFrom: clientUrlArn,
          },
        ],
      },
      { parent: this },
    );

    this.apiUrl = apiLbUrl;
  }
}
