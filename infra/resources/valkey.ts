import * as p from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VPC } from "../types";
type Props = {
  name: string;
  product: string;
  vpc: VPC;
};
export class ThreadValkey extends p.ComponentResource {
  public readonly valkeySsmArn: p.Output<string>;
  constructor({ name, product, vpc }: Props, opts?: p.ComponentResourceOptions) {
    super(`pkg:index:${product}-${name}-valkey`, name, {}, opts);
    const stack = p.getStack();
    const valkeySg = new aws.ec2.SecurityGroup(
      name,
      {
        name: `${name}-sg`,
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 6379,
            toPort: 6379,
            protocol: "tcp",
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
      },
      { parent: this },
    );

    const subnetGroup = new aws.memorydb.SubnetGroup(
      `${name}-subnetgroup`,
      {
        subnetIds: vpc.privateSubnets,
        name: `${name}-subnetgroup`,
      },
      { parent: this },
    );
    const valkey = new aws.memorydb.Cluster(name, {
      name: name,
      securityGroupIds: [valkeySg.id],
      subnetGroupName: subnetGroup.name,
      engine: "valkey",
      nodeType: "db.t4g.small",
      engineVersion: "7.2",
      numShards: 1,
      snapshotRetentionLimit: 7,
      aclName: "open-access",
      tlsEnabled: true,
    });
    // if we have more than 1 shard we should loop and store them using p.all()
    const url = valkey.clusterEndpoints[0];
    const valkeyUrl = p.interpolate`rediss://${url.address}:${url.port}`;
    const { arn } = new aws.ssm.Parameter(
      `${product}-valkey-url`,
      {
        name: `/${product}-${stack}/valkey-url`,
        value: valkeyUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    this.valkeySsmArn = arn;
    this.registerOutputs({
      valkeySsmArn: this.valkeySsmArn,
    });
  }
}
