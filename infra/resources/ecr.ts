import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { ecr } from "@pulumi/aws";
type Props = {
  name: string;
  product: string;
};
export class ThreadDockerImageRepo extends ComponentResource {
  public readonly imageRepo: Output<string>;
  constructor({ name, product }: Props, opts?: ComponentResourceOptions) {
    super(`pkg:index:${product}-${name}-ecr`, name, {}, opts);
    const imageRepo = new ecr.Repository(
      name,
      {
        name: `${product}/${name}`,
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
