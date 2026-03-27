import * as p from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as aws from "@pulumi/aws";
import { VPC } from "../types";
import { ThreadSsmParameter } from "./ssm";
interface Props {
  name: string;
  product: string;
  dbName: string;
  vpc: VPC;
}
export class ThreadRds extends p.ComponentResource {
  public readonly rdsSsmArn: p.Output<string>;
  constructor({ dbName, name, product, vpc }: Props, opts?: p.ComponentResourceOptions) {
    super(`pkg:index:${product}-${name}-lb`, name, {}, opts);
    const user = `${product}User`;
    const dbPassword = new random.RandomPassword("db-password", {
      length: 12,
      special: false,
    }).result;
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(name, {
      name: `${name}-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          cidrBlocks: [vpc.cidrBlock],
        },
      ],
    });
    const subnetGroup = new aws.rds.SubnetGroup(name, {
      name: `${name}-subentgroup`,
      subnetIds: vpc.privateSubnets,
    });
    const rds = new aws.rds.Instance(
      name,
      {
        allocatedStorage: 10,
        autoMinorVersionUpgrade: true,
        maxAllocatedStorage: 40,
        engine: aws.rds.EngineType.Postgres,
        dbSubnetGroupName: subnetGroup.name,
        engineVersion: "16",
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        instanceClass: aws.rds.InstanceType.T3_Micro,
        dbName,
        username: user,
        password: dbPassword,
        skipFinalSnapshot: true,
      },
      { parent: this },
    );
    const databaseUrl = p.interpolate`postgresql://${user}:${dbPassword}@${rds.endpoint}/${dbName}?sslmode=require`;
    const { arn } = new ThreadSsmParameter(
      {
        name: "rds-url",
        product,
        value: databaseUrl,
        isSecret: true,
      },
      { parent: this },
    );
    this.rdsSsmArn = arn;
    this.registerOutputs({
      rdsSsmArn: this.rdsSsmArn,
    });
  }
}
