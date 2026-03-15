import * as p from "@pulumi/pulumi";
import { ThreadEcs } from "../resources/ecs";
interface Props {
  name: string;
  cluster: p.Output<string>;
  imageRepo: p.Output<string>;
  apiUrl: p.Output<string>;
}
export class ThreadFrontend extends p.ComponentResource {
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    super("thread-frontend", props.name, {}, opts);
    new ThreadEcs(
      {
        name: "web",
        publicIp: true,
        port: 3000,
        cluster: props.cluster,
        imageRepo: props.imageRepo,
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
