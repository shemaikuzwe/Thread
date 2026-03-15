import * as awsx from "@pulumi/awsx";
import * as p from "@pulumi/pulumi";

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
  cluster: p.Output<string>;
  port: number;
  publicIp?: boolean;
  imageRepo: p.Output<string>;
  secrets?: Secret[];
  environment?: Environment[];
}
export class ThreadEcs extends p.ComponentResource {
  public readonly lbUrl: p.Output<string>;
  constructor(
    { name, cluster, imageRepo, port, publicIp, environment, secrets }: Props,
    opts?: p.ComponentResourceOptions,
  ) {
    super(`thread-${name}-ecs`, name, {}, opts);

    const lb = new awsx.lb.ApplicationLoadBalancer(`thread-${name}-lb`);
    this.lbUrl = p.interpolate`http://${lb.loadBalancer.dnsName}`;
    new awsx.ecs.FargateService(
      `${name}-service`,
      {
        cluster,
        desiredCount: 1,
        taskDefinitionArgs: {
          container: {
            image: p.interpolate`${imageRepo}:${name}:latest`,
            name,
            cpu: 128,
            memory: 512,
            essential: true,
            secrets,
            environment,
            portMappings: [
              {
                containerPort: port,
                targetGroup: lb.defaultTargetGroup,
              },
            ],
          },
        },
        assignPublicIp: publicIp ?? false,
      },
      { parent: this },
    );
  }
}
