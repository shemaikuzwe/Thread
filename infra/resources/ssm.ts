import * as p from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { ssm } from "@pulumi/aws";

type Props = {
  name: string;
  product: string;
  value: p.Input<string>;
  isSecret?: boolean;
};

export class ThreadSsmParameter extends ComponentResource {
  public readonly arn: Output<string>;

  constructor({ name, product, value, isSecret = false }: Props, opts?: ComponentResourceOptions) {
    super(`pkg:index:${product}-${name}-ssm`, name, {}, opts);

    const parameter = new ssm.Parameter(
      `${product}-${name}`,
      {
        name: `/${product}/${name}`,
        value: value,
        type: isSecret ? "SecureString" : "String",
      },
      {
        parent: this,
        ignoreChanges: isSecret ? ["value"] : [],
      },
    );

    this.arn = parameter.arn;

    this.registerOutputs({
      arn: this.arn,
    });
  }
}
