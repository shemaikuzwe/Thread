import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as p from "@pulumi/pulumi";
import { ThreadBackend } from "./services/backend";
import { ThreadFrontend } from "./services/frontend";
function main() {
  const stack = p.getStack();

  const cluster = new aws.ecs.Cluster("thread-cluster");
  const vpc = new awsx.ec2.Vpc("vpc");

  const vpcId = vpc.vpcId;
  const privateSubnetIds = vpc.privateSubnetIds;
  const publicSubnetIds = vpc.publicSubnetIds;
  const backend = new ThreadBackend({
    name: `thread-${stack}-backend`,
    cluster: cluster.arn,
  });
  new ThreadFrontend({
    name: `thread-${stack}-frontend`,
    cluster: cluster.arn,
    apiUrl: backend.apiUrl,
  });
}

main();
