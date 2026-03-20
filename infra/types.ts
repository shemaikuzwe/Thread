import * as p from "@pulumi/pulumi";
export interface VPC {
  id: p.Input<string>;
  cidrBlock:string;
  publicSubnets: p.Input<string>[];
  privateSubnets: p.Input<string>[];
}
