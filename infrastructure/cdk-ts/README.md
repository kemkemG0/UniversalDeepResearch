# Universal Deep Research - TypeScript CDK

This directory contains the TypeScript CDK infrastructure for Universal Deep Research (UDR).

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured
- CDK CLI installed (`npm install -g aws-cdk`)

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy all stacks
npm run deploy:all

# Or deploy individual stacks
npm run deploy:gateway
npm run deploy:backend
npm run deploy:frontend
```

## Project Structure

```
src/
├── app.ts                 # Main CDK app
└── stacks/
    ├── gateway-stack.ts   # Bedrock Access Gateway
    ├── backend-stack.ts   # UDR Backend (ECS)
    └── frontend-stack.ts  # UDR Frontend (Amplify)
```

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch mode compilation
- `npm run synth` - Synthesize CloudFormation templates
- `npm run deploy` - Deploy all stacks
- `npm run deploy:gateway` - Deploy gateway only
- `npm run deploy:backend` - Deploy backend only
- `npm run deploy:frontend` - Deploy frontend only
- `npm run destroy` - Destroy all stacks
- `npm run diff` - Show differences

## Configuration

### Context Variables

Set these via CDK context or environment variables:

```bash
# GitHub integration (optional)
cdk deploy --context github_repo=username/repo --context github_token_secret=github-token

# Or use environment variables
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
```

### Environment Variables

- `CDK_DEFAULT_ACCOUNT` - AWS Account ID
- `CDK_DEFAULT_REGION` - AWS Region (default: us-east-1)

## Deployment

### With GitHub Integration

```bash
# Setup GitHub token first
../scripts/setup-github-token.sh <your-token>

# Deploy with auto-deployment
../scripts/deploy-ts.sh username/repo github-token
```

### Manual Deployment

```bash
# Deploy without GitHub integration
../scripts/deploy-ts.sh
```

## Stack Dependencies

```
BedrockGatewayStack
       ↓
UDRBackendStack
       ↓
UDRFrontendStack
```

## Outputs

After deployment, you'll get:

- **Frontend URL**: Amplify app URL
- **Backend URL**: ECS service URL
- **Gateway URL**: Bedrock gateway URL
- **Amplify App ID**: For manual configuration

## Development

### Local Development

```bash
# Watch mode for development
npm run watch

# In another terminal
npm run cdk -- diff
npm run cdk -- deploy --hotswap  # For faster development deployments
```

### Debugging

```bash
# Synthesize to see generated CloudFormation
npm run synth

# Show differences before deployment
npm run diff
```

## Cleanup

```bash
# Destroy all resources
npm run destroy
```

## TypeScript Benefits

- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better IDE support and autocomplete
- **Refactoring**: Safer code changes
- **Documentation**: Self-documenting with TypeScript types