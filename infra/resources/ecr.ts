import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { ecr } from "@pulumi/aws";
type Props = {
  name: string;
};
export class ThreadDockerImageRepo extends ComponentResource {
  public readonly imageRepo: Output<string>;
  constructor(args: Props, opts?: ComponentResourceOptions) {
    const resourceName = `${args.name}`;
    super("pkg:index:ThreadEcr ", resourceName, {}, opts);
    const imageRepo = new ecr.Repository(
      args.name,
      {
        name: resourceName,
        imageScanningConfiguration: {
          scanOnPush: false,
        },
        imageTagMutability: "MUTABLE",
      },
      { parent: this },
    );
    this.imageRepo = imageRepo.repositoryUrl;
    this.imageRepo.apply((repo) => console.log(`Repo: ${repo}`));
    this.registerOutputs({
      imageRepo: this.imageRepo,
    });
  }
}
