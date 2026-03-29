import * as aws from "@pulumi/aws";
import * as p from "@pulumi/pulumi";
import { ThreadBackend } from "./services/backend";
import { ThreadFrontend } from "./services/frontend";
import { ThreadVpc } from "./resources/vpc";

const config = new p.Config();
const imageTag = config.get("imageTag") ?? "latest";

const stack = p.getStack();
const product = `thread${stack}`;
const { arn: clusterArn, } = new aws.ecs.Cluster(`${product}-cluster`);
const cidrBlock = "10.0.0.0/16";
const azs = aws.getAvailabilityZones({ state: "available" });
const vpc = new ThreadVpc(`${product}-vpc`, {
  azs: azs.then((az) => az.names.slice(0, 3)),
  cidr: cidrBlock,
  natGateway: {
    enable: true,
    single: true,
  },
  privateSubnets: {
    cidrBlocks: ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"],
  },
  publicSubnets: {
    cidrBlocks: ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"],
    mapPublicIpOnLaunch: true,
  },
});

const taskRole = new aws.iam.Role(`${product}-task-role`, {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  },
});
const executionRole = new aws.iam.Role(`${product}-execution-role`, {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: { Service: "ecs-tasks.amazonaws.com" },
      },
    ],
  },
});

new aws.iam.RolePolicy(`${product}-task-role-policy`, {
  role: executionRole.id,
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: "kms:Decrypt",
        Resource: "*",
      },
    ],
  },
});
new aws.iam.PolicyAttachment(`${product}-task-role-policyAttachment`, {
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  roles: [executionRole.id],
});

 new ThreadBackend({
  name: `backend`,
  product,
  vpc: {
    id: vpc.vpcId,
    cidrBlock: cidrBlock,
    privateSubnets: vpc.privateSubnetIds,
    publicSubnets: vpc.publicSubnetIds,
  },
  cluster: clusterArn,
  taskRoleArn: taskRole.arn,
  executionRoleArn: executionRole.arn,
  imageTag,
});

 new ThreadFrontend({
  name: `frontend`,
  product,
  cluster: clusterArn,
  vpc: {
    id: vpc.vpcId,
    cidrBlock: cidrBlock,
    privateSubnets: vpc.privateSubnetIds,
    publicSubnets: vpc.publicSubnetIds,
  },
  taskRoleArn: taskRole.arn,
  executionRoleArn: executionRole.arn,
  imageTag,
});
