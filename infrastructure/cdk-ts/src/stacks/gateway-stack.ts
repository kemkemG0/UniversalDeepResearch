import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

/**
 * Bedrock Access Gateway Stack
 * 
 * Deploys the Bedrock Access Gateway from the submodule
 */
export class BedrockGatewayStack extends cdk.Stack {
  public readonly gatewayUrl: string;
  public readonly gatewayUrlExport: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'GatewayVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'GatewayCluster', {
      vpc,
      containerInsights: true,
    });

    // Task Role with Bedrock permissions
    const taskRole = new iam.Role(this, 'GatewayTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
      ],
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'GatewayTaskDef', {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole,
    });

    // Container from submodule
    const container = taskDefinition.addContainer('GatewayContainer', {
      image: ecs.ContainerImage.fromAsset('../../infrastructure/bedrock-gateway/src'), // Submodule path
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'bedrock-gateway',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        PORT: '8080',
        AWS_REGION: this.region,
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Fargate Service
    const service = new ecs.FargateService(this, 'GatewayService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'GatewayALB', {
      vpc,
      internetFacing: true,
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'GatewayTargets', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service.loadBalancerTarget({
          containerName: 'GatewayContainer',
          containerPort: 8080,
        }),
      ],
    });

    // Listener
    alb.addListener('GatewayListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // Store Gateway URL
    this.gatewayUrl = `http://${alb.loadBalancerDnsName}`;

    // Outputs
    new cdk.CfnOutput(this, 'GatewayURL', {
      value: this.gatewayUrl,
      description: 'Bedrock Access Gateway URL',
    });

    this.gatewayUrlExport = new cdk.CfnOutput(this, 'GatewayURLExport', {
      value: this.gatewayUrl,
      exportName: 'BedrockGatewayURL',
    });
  }
}