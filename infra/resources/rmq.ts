import * as p from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as aws from "@pulumi/aws";
import { VPC } from "../types";
import { ThreadSsmParameter } from "./ssm";
type Props = {
  product: string;
  name: string;
  vpc: VPC;
};
export class ThreadRmq extends p.ComponentResource {
  public readonly rmqSsmArn: p.Output<string>;
  constructor({ name, vpc, product }: Props, opts?: p.ComponentResourceOptions) {
    super(`pkg:index:${product}-${name}-lb`, name, {}, opts);
    const stack = p.getStack();
    const user = `${product}${stack}`;
    const rmqPassword = new random.RandomPassword("rmq-password", {
      length: 12,
      special: false,
    }).result;
    const rmqSg = new aws.ec2.SecurityGroup(
      name,
      {
        name: `${name}-sg`,
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 5672,
            toPort: 5672,
            protocol: "tcp",
            cidrBlocks: [vpc.cidrBlock],
          },
          {
            fromPort: 5671,
            toPort: 5671,
            protocol: "tcp",
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
      },
      { parent: this },
    );
    const rmq = new aws.mq.Broker(
      name,
      {
        brokerName: name,
        securityGroups: [rmqSg.id],
        subnetIds: [vpc.privateSubnets[0]],
        engineType: "RabbitMQ",
        engineVersion: "3.13",
        autoMinorVersionUpgrade: true,
        users: [
          {
            username: user,
            password: rmqPassword,
          },
        ],
        hostInstanceType: "mq.m7g.medium",
      },
      { parent: this },
    );
    const rmqEndpoint = rmq.instances[0].endpoints[0];
    const rmqUrl = p.interpolate`amqps://${user}:${rmqPassword}@${rmqEndpoint}`;
    const consoleUrl = rmq.instances[0].consoleUrl;
    const { arn } = new ThreadSsmParameter(
      {
        name: "rmq-url",
        product,
        value: rmqUrl,
        isSecret: true,
      },
      { parent: this },
    );
    new ThreadSsmParameter(
      {
        name: "rmq-console",
        product,
        value: consoleUrl,
        isSecret: true,
      },
      { parent: this },
    );
    this.rmqSsmArn = arn;
    this.registerOutputs({
      rmqUrlArn: this.rmqSsmArn,
    });
  }
}
