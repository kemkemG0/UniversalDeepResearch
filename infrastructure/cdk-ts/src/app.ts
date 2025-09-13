#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockGatewayStack } from './stacks/gateway-stack';
import { UDRBackendStack } from './stacks/backend-stack';
import { UDRFrontendStack } from './stacks/frontend-stack';

/**
 * Universal Deep Research (UDR) CDK Application
 * 
 * This CDK app deploys:
 * 1. Bedrock Access Gateway (from submodule)
 * 2. UDR Backend (FastAPI on ECS)
 * 3. UDR Frontend (Next.js on Amplify)
 */

const app = new cdk.App();

// Environment configuration
const env: cdk.Environment = {
  account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
  region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Deploy Bedrock Access Gateway
const gatewayStack = new BedrockGatewayStack(app, 'BedrockGatewayStack', {
  env,
  description: 'Bedrock Access Gateway for OpenAI compatibility',
});

// Deploy UDR Backend
const backendStack = new UDRBackendStack(app, 'UDRBackendStack', {
  gatewayUrl: gatewayStack.gatewayUrl,
  env,
  description: 'Universal Deep Research Backend (FastAPI + ECS)',
});

// Deploy UDR Frontend
const frontendStack = new UDRFrontendStack(app, 'UDRFrontendStack', {
  backendUrl: backendStack.backendUrl,
  githubRepo: app.node.tryGetContext('github_repo'), // e.g., "username/repo"
  githubToken: app.node.tryGetContext('github_token_secret'), // Secrets Manager name
  env,
  description: 'Universal Deep Research Frontend (Next.js + Amplify)',
});

// Add dependencies
backendStack.addDependency(gatewayStack);
frontendStack.addDependency(backendStack);

app.synth();