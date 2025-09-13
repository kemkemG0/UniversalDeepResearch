import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface UDRBackendStackProps extends cdk.StackProps {
    gatewayUrl: string;
}

/**
 * UDR Backend Stack
 * 
 * Deploys the FastAPI backend with ECS Fargate
 */
export class UDRBackendStack extends cdk.Stack {
    public readonly backendUrl: string;
    public readonly backendAlbArn: string;
    public readonly backendUrlOutput: cdk.CfnOutput;

    constructor(scope: Construct, id: string, props: UDRBackendStackProps) {
        super(scope, id, props);

        // Import VPC or create new one
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            isDefault: true,
        });

        // ECS Cluster for Backend
        const cluster = new ecs.Cluster(this, 'UDRBackendCluster', {
            vpc,
            containerInsights: true,
            clusterName: 'udr-backend-cluster',
        });

        // Secrets for API keys
        const apiSecrets = new secretsmanager.Secret(this, 'UDRBackendSecrets', {
            description: 'API keys for UDR backend application',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ tavily_api_key: '' }),
                generateStringKey: 'nvidia_api_key',
                excludeCharacters: '"@/\\',
            },
        });

        // Task Role with necessary permissions
        const taskRole = new iam.Role(this, 'BackendTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
            ],
        });

        // Grant access to secrets
        apiSecrets.grantRead(taskRole);

        // Backend Task Definition
        const backendTask = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
            memoryLimitMiB: 2048,
            cpu: 1024,
            taskRole,
            executionRole: taskRole,
        });

        // Backend Container
        const backendContainer = backendTask.addContainer('BackendContainer', {
            image: ecs.ContainerImage.fromAsset('../../backend'),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'udr-backend',
                logRetention: logs.RetentionDays.ONE_WEEK,
            }),
            environment: {
                HOST: '0.0.0.0',
                PORT: '8000',
                LOG_LEVEL: 'info',
                DEFAULT_MODEL: 'claude-3-sonnet',
                LLM_BASE_URL: `${props.gatewayUrl}/v1`, // Use Gateway URL
                LLM_API_KEY_FILE: '/tmp/dummy_key.txt', // Dummy for Gateway
                TAVILY_API_KEY_FILE: '/tmp/tavily_key.txt',
                MAX_TOPICS: '3',
                MAX_SEARCH_PHRASES: '5',
            },
            secrets: {
                NVIDIA_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'nvidia_api_key'),
                TAVILY_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'tavily_api_key'),
            },
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:8000/ || exit 1'],
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                retries: 3,
                startPeriod: cdk.Duration.seconds(60),
            },
        });

        backendContainer.addPortMappings({
            containerPort: 8000,
            protocol: ecs.Protocol.TCP,
        });

        // Security Group for Backend
        const backendSg = new ec2.SecurityGroup(this, 'BackendSecurityGroup', {
            vpc,
            description: 'Security group for UDR Backend',
            allowAllOutbound: true,
        });

        backendSg.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(8000),
            'Allow HTTP traffic to backend'
        );

        // Backend Service
        const backendService = new ecs.FargateService(this, 'BackendService', {
            cluster,
            taskDefinition: backendTask,
            desiredCount: 1,
            securityGroups: [backendSg],
            serviceName: 'udr-backend-service',
        });

        // Backend Load Balancer
        const backendAlb = new elbv2.ApplicationLoadBalancer(this, 'BackendALB', {
            vpc,
            internetFacing: true, // Public for Amplify access
            loadBalancerName: 'udr-backend-alb',
        });

        // Backend Target Group
        const backendTg = new elbv2.ApplicationTargetGroup(this, 'BackendTargets', {
            vpc,
            port: 8000,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [
                backendService.loadBalancerTarget({
                    containerName: 'BackendContainer',
                    containerPort: 8000,
                }),
            ],
            healthCheck: {
                path: '/',
                healthyHttpCodes: '200',
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3,
            },
        });

        // Backend Listener
        const backendListener = backendAlb.addListener('BackendListener', {
            port: 80,
            defaultAction: elbv2.ListenerAction.forward([backendTg]),
        });

        // CORS configuration for Amplify
        backendListener.addAction('CorsAction', {
            priority: 100,
            conditions: [
                elbv2.ListenerCondition.httpHeader('Origin', ['*.amplifyapp.com']),
            ],
            action: elbv2.ListenerAction.forward([backendTg]),
        });

        // Store backend URL for export
        this.backendUrl = `http://${backendAlb.loadBalancerDnsName}`;
        this.backendAlbArn = backendAlb.loadBalancerArn;

        // Outputs
        this.backendUrlOutput = new cdk.CfnOutput(this, 'BackendURL', {
            value: this.backendUrl,
            description: 'UDR Backend API URL',
            exportName: 'UDRBackendURL',
        });

        new cdk.CfnOutput(this, 'BackendALBArn', {
            value: this.backendAlbArn,
            description: 'Backend ALB ARN',
        });

        new cdk.CfnOutput(this, 'BackendClusterName', {
            value: cluster.clusterName,
            description: 'Backend ECS Cluster Name',
        });

        new cdk.CfnOutput(this, 'BackendServiceName', {
            value: backendService.serviceName,
            description: 'Backend ECS Service Name',
        });
    }
}