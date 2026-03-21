import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface Props {
  cidr: string;
  azs: pulumi.Input<string[]>;
  tags?: Record<string, string>;
  publicSubnets?: {
    cidrBlocks: string[];
    mapPublicIpOnLaunch?: boolean;
  };
  privateSubnets?: {
    cidrBlocks: string[];
  };
  natGateway?: {
    enable: boolean;
    single?: boolean;
  };
}

export class ThreadVpc extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: Props, opts?: pulumi.ComponentResourceOptions) {
    super(`pkg:index:${name}`, name, {}, { ...opts, aliases: [{ type: `custom:aws:${name}` }] });
    const childOpts = { parent: this };
    const tags = { Name: name, ...args.tags };

    // VPC
    const vpc = new aws.ec2.Vpc(
      name,
      {
        cidrBlock: args.cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags,
      },
      childOpts,
    );

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: vpc.id,
        tags,
      },
      childOpts,
    );

    const azs = pulumi.output(args.azs);

    // Public Subnets
    this.publicSubnetIds = (args.publicSubnets?.cidrBlocks ?? []).map((cidr, i) => {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-${i}`,
        {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: azs.apply((a) => a[i]),
          mapPublicIpOnLaunch: args.publicSubnets?.mapPublicIpOnLaunch ?? true,
          tags: { ...tags, Name: `${name}-public-${i}` },
        },
        childOpts,
      );

      // Route table per public subnet
      const rt = new aws.ec2.RouteTable(
        `${name}-public-rt-${i}`,
        {
          vpcId: vpc.id,
          routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
          tags,
        },
        childOpts,
      );

      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: rt.id,
        },
        childOpts,
      );

      return subnet.id;
    });

    // NAT Gateway (on first public subnet)
    let natGatewayId: pulumi.Output<string> | undefined;
    if (args.natGateway?.enable && this.publicSubnetIds.length > 0) {
      const eip = new aws.ec2.Eip(`${name}-nat-eip`, { domain: "vpc", tags }, childOpts);
      const nat = new aws.ec2.NatGateway(
        `${name}-nat`,
        {
          subnetId: this.publicSubnetIds[0],
          allocationId: eip.id,
          tags,
        },
        childOpts,
      );
      natGatewayId = nat.id;
    }

    // Private Subnets
    this.privateSubnetIds = (args.privateSubnets?.cidrBlocks ?? []).map((cidr, i) => {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-${i}`,
        {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: azs.apply((a) => a[i]),
          tags: { ...tags, Name: `${name}-private-${i}` },
        },
        childOpts,
      );

      if (natGatewayId) {
        // single NAT: all private subnets use the same one
        const natId = args.natGateway?.single ? natGatewayId : natGatewayId; // extend here for per-AZ NAT GWs

        const rt = new aws.ec2.RouteTable(
          `${name}-private-rt-${i}`,
          {
            vpcId: vpc.id,
            routes: [{ cidrBlock: "0.0.0.0/0", natGatewayId: natId }],
            tags,
          },
          childOpts,
        );

        new aws.ec2.RouteTableAssociation(
          `${name}-private-rta-${i}`,
          {
            subnetId: subnet.id,
            routeTableId: rt.id,
          },
          childOpts,
        );
      }

      return subnet.id;
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
