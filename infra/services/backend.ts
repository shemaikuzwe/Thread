import * as p from "@pulumi/pulumi";
import { ThreadRmq } from "../resources/rmq";
import { ThreadRds } from "../resources/rds";
import { ThreadEcs } from "../resources/ecs";
import { ThreadValkey } from "../resources/valkey";
type Props = {
  name: string;
  cluster: p.Output<string>;
  imageRepo: p.Output<string>;
};
export class ThreadBackend extends p.ComponentResource {
  public readonly apiUrl: p.Output<string>;
  constructor(props: Props, opts?: p.ComponentResourceOptions) {
    super("thread-backend", props.name, {}, opts);
    const { rdsSsmArn } = new ThreadRds({ name: "thread", dbName: "thread" }, { parent: this });
    const { rmqSsmArn } = new ThreadRmq({ name: "thread" }, { parent: this });
    const { valkeySsmArn } = new ThreadValkey({ name: "thread" }, { parent: this });
    const API_PORT = 8000;
    const {lbUrl:apiLbUrl}= new ThreadEcs(
      {
        name: "api",
        publicIp: true,
        port: API_PORT,
        cluster: props.cluster,
        imageRepo: props.imageRepo,
        secrets: [
          {
            name: "DATABASE_URL",
            valueFrom: rdsSsmArn,
          },
          {
            name: "REDIS_URL",
            valueFrom: valkeySsmArn,
          },
        ],
        environment: [
          {
            name: "PORT",
            value: API_PORT.toString(),
          },
        ],
      },
      { parent: this },
    );
    this.apiUrl = apiLbUrl;
  }
}
