import * as p from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
type Props = {
  name: string;
};
export class ThreadValkey extends p.ComponentResource {
  public readonly valkeySsmArn: p.Output<string>;
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    const valKeyName = `${props.name}-valkey`;
    super("thread-memory-db", valKeyName, {}, opts);
    const stack = p.getStack();
    const valkey = new aws.memorydb.Cluster(valKeyName, {
      name: valKeyName,
      engine: "redis",
      nodeType: "db.t4g.small",
      engineVersion: "7.1",
      numShards: 1,
      snapshotRetentionLimit: 7,
      aclName: "open-access",
    });
    // if we have more than 1 shard we should loop and store them using p.all()
    const url = valkey.clusterEndpoints[0];
    const valkeyUrl = p.interpolate`redis://${url.address}:${url.port}`;
    const { arn } = new aws.ssm.Parameter(
      `${props.name}-valkey-url`,
      {
        name: `/${props.name}-${stack}/rmq-url`,
        value: valkeyUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    valkeyUrl.apply((u) => console.log(u));
    this.valkeySsmArn = arn;
    this.registerOutputs({
      valkeySsmArn: this.valkeySsmArn,
    });
  }
}
