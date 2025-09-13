#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UDRFrontendStack } from './stacks/frontend-stack';

/**
 * Universal Deep Research (UDR) Frontend-Only CDK Application
 * 
 * This CDK app deploys only the frontend:
 * - UDR Frontend (Next.js on Amplify)
 */

const app = new cdk.App();

// Environment configuration
const env: cdk.Environment = {
    account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
    region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Deploy UDR Frontend only

app.synth();