import * as aws from "@pulumi/aws";
import * as p from "@pulumi/pulumi";
import { ThreadLB } from "./lb";
import { VPC } from "../types";

interface Secret {
  name: string;
  valueFrom: p.Input<string>;
}
interface Environment {
  name: string;
  value: p.Input<string>;
}
interface Props {
  name: string;
  product: string;
  cluster: p.Input<string>;
  port: number;
  publicIp?: boolean;
  imageRepo: p.Input<string>;
  vpc: VPC;
  secrets?: Secret[];
  environment?: Environment[];
  type?: "application" | "network";
  taskRoleArn: p.Input<string>;
  executionRoleArn: p.Input<string>;
  healthCheckLivePath?: string;
  healthCheckReadyPath?: string;
}
export class ThreadEcs extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;
  constructor(
    {
      name,
      product,
      cluster,
      taskRoleArn,
      imageRepo,
      port,
      type = "application",
      publicIp,
      vpc,
      environment,
      secrets,
      executionRoleArn,
      healthCheckLivePath = "/health/live",
      healthCheckReadyPath = "/health/ready",
    }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}-ecs`, name, {}, opts);
    const region = aws.getRegion().then((r) => r.region);
    const loadBalancer = new ThreadLB({
      name: name,
      product: product,
      port: port,
      subnets: vpc.publicSubnets,
      type,
      vpcId: vpc.id,
      cidrBlock: vpc.cidrBlock,
      healthCheckPath: healthCheckReadyPath,
    });
    const logGroup = new aws.cloudwatch.LogGroup(`${product}-${name}-ecs`, {
      name: `${product}-${name}-ecs`,
      retentionInDays: 7,
    });

    this.lbUrl = loadBalancer.lbUrl;
    const ecsServiceSg = new aws.ec2.SecurityGroup(`${name}-ecs-sg`, {
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: port,
          toPort: port,
          protocol: "tcp",
          securityGroups: [loadBalancer.lbSg],
        },
      ],
      egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
    });

    const taskDefinition = new aws.ecs.TaskDefinition(
      `${product}-${name}-ecs-taskDefinition`,
      {
        cpu: "256",
        memory: "512",
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        family: name,
        taskRoleArn: taskRoleArn,
        executionRoleArn: executionRoleArn,
        containerDefinitions: p.jsonStringify([
          {
            name: name,
            image: p.interpolate`${imageRepo}:latest`,
            cpu: 256,
            memory: 512,
            essential: true,
            environment,
            secrets,
            healthCheck: {
              command: [
                "CMD-SHELL",
                `wget -qO- http://localhost:${port}${healthCheckLivePath} || exit 1`,
              ],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": logGroup.name,
                "awslogs-region": region,
                "awslogs-stream-prefix": "ecs",
              },
            },
            portMappings: [
              {
                containerPort: port,
                hostPort: port,
              },
            ],
          },
        ]),
      },
      { parent: this },
    );
    new aws.ecs.Service(
      `${product}-${name}-ecs-service`,
      {
        cluster: cluster,
        taskDefinition: taskDefinition.arn,
        desiredCount: 1,
        launchType: "FARGATE",
        networkConfiguration: {
          assignPublicIp: publicIp ?? false,
          securityGroups: [ecsServiceSg.id],
          subnets: publicIp ? vpc.publicSubnets : vpc.privateSubnets,
        },
        loadBalancers: [
          {
            targetGroupArn: loadBalancer.targetGroup.arn,
            containerPort: port,
            containerName: name,
          },
        ],
      },
      { parent: this },
    );

    this.registerOutputs({
      lbUrl: this.lbUrl,
    });
  }
}
