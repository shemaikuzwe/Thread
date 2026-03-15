import * as p from "@pulumi/pulumi";
import { nanoid } from "nanoid";
import * as aws from "@pulumi/aws";
type Props = {
  name: string;
};
export class ThreadRmq extends p.ComponentResource {
  public readonly rmqSsmArn: p.Output<string>;
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    const brokerName = `${props.name}-rmq`;
    super("thread-rmq", brokerName, {}, opts);
    const stack = p.getStack();
    const user = `thread${stack}`;
    const rmqPassword = nanoid(12);

    const rmq = new aws.mq.Broker(
      brokerName,
      {
        brokerName,
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
      `${props.name}-rmq-url`,
      {
        name: `/${props.name}-${stack}/rmq-url`,
        value: rmqUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    new aws.ssm.Parameter(
      `${props.name}-rmq-console`,
      {
        name: `/${props.name}-${stack}/rmq-console`,
        value: consoleUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    rmqUrl.apply((endpoint) => console.log(endpoint));
    consoleUrl.apply((endpoint) => console.log("console url", endpoint));
    this.rmqSsmArn = arn;
    this.registerOutputs({
      rmqUrlArn: this.rmqSsmArn,
    });
  }
}
