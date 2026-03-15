import * as aws from "@pulumi/aws";
import * as p from "@pulumi/pulumi";
import { ThreadBackend } from "./services/backend";
import { ThreadDockerImageRepo } from "./resources/ecr";
import { ThreadFrontend } from "./services/frontend";
function main() {
  const stack = p.getStack();
  const { imageRepo } = new ThreadDockerImageRepo({ name: `thread-${stack}` });

  const cluster = new aws.ecs.Cluster("thread-cluster");
  const backend = new ThreadBackend({
    name: `thread-${stack}-backend`,
    imageRepo,
    cluster: cluster.arn,
  });
  new ThreadFrontend({
    name: `thread-${stack}-frontend`,
    cluster: cluster.arn,
    imageRepo,
    apiUrl: backend.apiUrl,
  });
}

main();
