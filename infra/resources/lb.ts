import * as p from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
type Props = {
  name: string;
  product: string;
  type: "application" | "network";
  internal?: boolean;
  port: number;
  subnets: p.Input<string>[];
  vpcId: p.Input<string>;
  cidrBlock: string;
  healthCheckPath?: string;
};
export class ThreadLB extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly lbSg: p.Output<string>;

  constructor(
    {
      name,
      product,
      type,
      internal = false,
      subnets,
      port,
      vpcId,
      cidrBlock,
      healthCheckPath = "/health/ready",
    }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`pkg:index:${product}-${name}-lb`, name, {}, opts);
    const albSg = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: vpcId,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            cidrBlocks: internal ? [cidrBlock] : ["0.0.0.0/0"],
          },
        ],
        egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
      },
      { parent: this },
    );
    this.lbSg = albSg.id;
    const lb = new aws.lb.LoadBalancer(
      `${name}-lb`,
      {
        name: `${name}-lb`,
        loadBalancerType: type,
        internal,
        subnets,
        enableDeletionProtection: false,
        securityGroups: [albSg.id],
      },
      { parent: this },
    );
    const targetGroup = new aws.lb.TargetGroup(
      `${name}-targetgroup`,
      {
        port,
        protocol: type == "application" ? "HTTP" : "TCP",
        vpcId,
        targetType: "ip",
        healthCheck: {
          enabled: true,
          path: healthCheckPath,
          protocol: "HTTP",
          port: port.toString(),
          healthyThreshold: 3,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: "200",
        },
      },
      { parent: this },
    );
    new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: lb.arn,
        port: 80,
        protocol: type == "application" ? "HTTP" : "TCP",
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this },
    );

    this.lbUrl = p.interpolate`${type == "application" ? "http" : "tcp"}://${lb.dnsName}`;
    this.targetGroup = targetGroup;
    this.registerOutputs({
      lbUrl: this.lbUrl,
      targetGroup: this.targetGroup,
      lbSg: this.lbSg,
    });
  }
}
