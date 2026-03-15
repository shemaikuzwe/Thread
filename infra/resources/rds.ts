import * as p from "@pulumi/pulumi";
import { nanoid } from "nanoid";
import * as aws from "@pulumi/aws";
interface Props {
  name: string;
  dbName: string;
}
export class ThreadRds extends p.ComponentResource {
  public readonly rdsSsmArn: p.Output<string>;
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    const name = `${props.name}-rds`;

    super("thread-rds", name, {}, opts);
    const stack = p.getStack();
    const dbName = `${props.dbName}${stack}`;
    const user = `thread${stack}`;
    const dbPassword = nanoid(12);

    const rds = new aws.rds.Instance(
      name,
      {
        allocatedStorage: 10,
        autoMinorVersionUpgrade:true,
        maxAllocatedStorage: 40,
        engine: "postgres",
        engineVersion: "16",
        instanceClass: aws.rds.InstanceType.T3_Micro,
        dbName,
        username: user,
        password: dbPassword,
      },
      { parent: this },
    );
    const databaseUrl = p.interpolate`postgresql://${user}:${dbPassword}@${rds.endpoint}/${dbName}`;
    const { arn } = new aws.ssm.Parameter(
      `${props.name}-db-url`,
      {
        name: `/${props.name}-${stack}/db-url`,
        value: databaseUrl,
        type: "SecureString",
      },
      { parent: this },
    );
    this.rdsSsmArn = arn;
    databaseUrl.apply((url) => console.log(url));
    this.registerOutputs({
      rdsSsmArn: this.rdsSsmArn,
    });
  }
}
