import * as p from "@pulumi/pulumi";
import { ThreadEcs } from "../resources/ecs";
import { ThreadDockerImageRepo } from "../resources/ecr";
interface Props {
  name: string;
  cluster: p.Output<string>;
  apiUrl: p.Output<string>;
}
export class ThreadFrontend extends p.ComponentResource {
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    super("thread-frontend", props.name, {}, opts);
    const { imageRepo } = new ThreadDockerImageRepo({ name: "thread-web" });
    new ThreadEcs(
      {
        name: "web",
        publicIp: true,
        port: 3000,
        cluster: props.cluster,
        imageRepo: imageRepo,
        environment: [
          {
            name: "VITE_API_URL",
            value: props.apiUrl,
          },
        ],
      },
      { parent: this },
    );
  }
}
