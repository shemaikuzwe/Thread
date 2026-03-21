import * as p from "@pulumi/pulumi";
import { nanoid } from "nanoid";
import * as aws from "@pulumi/aws";
import { VPC } from "../types";
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
    const rmqPassword = nanoid(12);
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
        hostInstanceType: "mq.t3.micro",
      },
      { parent: this },
    );
    const rmqUrl = rmq.instances[0].endpoints[0];
    const consoleUrl = rmq.instances[0].consoleUrl;
    const { arn } = new aws.ssm.Parameter(
      `${product}-rmq-url`,
      {
        name: `/${product}-${stack}/rmq-url`,
        value: rmqUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    new aws.ssm.Parameter(
      `${product}-rmq-console`,
      {
        name: `/${product}/rmq-console`,
        value: consoleUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    this.rmqSsmArn = arn;
    this.registerOutputs({
      rmqUrlArn: this.rmqSsmArn,
    });
  }
}
