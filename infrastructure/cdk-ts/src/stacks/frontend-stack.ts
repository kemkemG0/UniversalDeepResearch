import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface UDRFrontendStackProps extends cdk.StackProps {
    backendUrl?: string;
    githubRepo?: string;
    githubToken?: string;
}

/**
 * UDR Frontend Stack
 * 
 * Deploys the Next.js frontend with AWS Amplify
 */
export class UDRFrontendStack extends cdk.Stack {
    public readonly frontendUrl: string;
    public readonly amplifyApp: amplify.App;
    public readonly mainBranch: amplify.Branch;

    constructor(scope: Construct, id: string, props: UDRFrontendStackProps) {
        super(scope, id, props);

        // Amplify Service Role
        const amplifyRole = new iam.Role(this, 'AmplifyServiceRole', {
            assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
            ],
        });

        // Environment variables for the frontend
        const environmentVariables: Record<string, string> = {
            NEXT_PUBLIC_BACKEND_BASE_URL: props.backendUrl || 'http://localhost:8000',
            NEXT_PUBLIC_BACKEND_PORT: '80',
            NEXT_PUBLIC_API_VERSION: 'v2',
            NEXT_PUBLIC_ENABLE_V2_API: 'true',
            NEXT_PUBLIC_DRY_RUN: 'true', // Enable dry run when no backend
            _LIVE_UPDATES: '[{"name":"Next.js version","pkg":"next","type":"npm","version":"latest"}]',
        };

        // Build specification for Amplify
        const buildSpec = codebuild.BuildSpec.fromObject({
            version: '1.0',
            applications: [
                {
                    frontend: {
                        phases: {
                            preBuild: {
                                commands: ['cd frontend', 'npm ci --cache .npm --prefer-offline'],
                            },
                            build: {
                                commands: ['npm run build'],
                            },
                        },
                        artifacts: {
                            baseDirectory: 'frontend/.next',
                            files: ['**/*'],
                        },
                        cache: {
                            paths: ['frontend/node_modules/**/*', 'frontend/.next/cache/**/*'],
                        },
                    },
                },
            ],
            env: {
                variables: environmentVariables,
            },
        });

        // Create Amplify App
        if (props.githubRepo && props.githubToken) {
            // GitHub integration
            this.amplifyApp = new amplify.App(this, 'UDRAmplifyApp', {
                appName: 'universal-deep-research',
                sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                    owner: props.githubRepo.split('/')[0],
                    repository: props.githubRepo.split('/')[1],
                    oauthToken: cdk.SecretValue.secretsManager(props.githubToken),
                }),
                buildSpec,
                environmentVariables,
                role: amplifyRole,
            });

            // Production branch (main)
            this.mainBranch = this.amplifyApp.addBranch('MainBranch', {
                autoBuild: true,
                branchName: 'main',
                environmentVariables,
            });

            this.frontendUrl = `https://${this.mainBranch.branchName}.${this.amplifyApp.defaultDomain}`;
        } else {
            // Manual deployment option
            this.amplifyApp = new amplify.App(this, 'UDRAmplifyApp', {
                appName: 'universal-deep-research',
                buildSpec,
                environmentVariables,
                role: amplifyRole,
            });

            // Manual branch (you'll need to connect repository manually)
            this.mainBranch = this.amplifyApp.addBranch('MainBranch', {
                autoBuild: true,
                branchName: 'main',
                environmentVariables,
            });

            this.frontendUrl = `https://${this.mainBranch.branchName}.${this.amplifyApp.defaultDomain}`;
        }

        // Custom domain (optional)
        // this.amplifyApp.addDomain('yourdomain.com', {
        //   subDomain: [
        //     amplify.SubDomain.create(this.mainBranch, '')
        //   ]
        // });

        // Outputs
        new cdk.CfnOutput(this, 'FrontendURL', {
            value: this.frontendUrl,
            description: 'UDR Frontend URL',
            exportName: 'UDRFrontendURL',
        });

        new cdk.CfnOutput(this, 'AmplifyAppId', {
            value: this.amplifyApp.appId,
            description: 'Amplify App ID',
        });

        new cdk.CfnOutput(this, 'AmplifyAppName', {
            value: this.amplifyApp.appName,
            description: 'Amplify App Name',
        });

        // Webhook for manual deployments
        if (!props.githubRepo) {
            const webhookBranch = this.amplifyApp.addBranch('WebhookBranch', {
                autoBuild: false,
                branchName: 'webhook',
            });

            new cdk.CfnOutput(this, 'WebhookURL', {
                value: `https://webhooks.amplify.${this.region}.amazonaws.com/prod/webhooks?id=${this.amplifyApp.appId}&token=<token>&operation=startbuild`,
                description: 'Webhook URL for manual deployments',
            });
        }
    }
}