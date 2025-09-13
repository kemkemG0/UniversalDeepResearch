# UDR Amplify Deployment Guide

このガイドでは、Universal Deep Research (UDR) をAWS Amplifyにデプロイする方法を説明します。

## アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AWS Amplify   │    │    ECS Fargate   │    │  Bedrock Gateway│
│   (Frontend)    │───▶│    (Backend)     │───▶│   (Submodule)   │
│   Next.js       │    │    FastAPI       │    │   OpenAI Compat │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## デプロイ手順

### 1. 前提条件

- AWS CLI設定済み
- CDK CLI インストール済み
- GitHub リポジトリ（オプション）

### 2. GitHub Token設定（自動デプロイ用）

```bash
# GitHub Personal Access Token を作成
# Scope: repo (Full control of private repositories)

# AWS Secrets Manager に保存
./scripts/setup-github-token.sh <your-github-token> github-token
```

### 3. デプロイ実行

#### 自動デプロイ（GitHub連携）
```bash
./scripts/deploy.sh username/repository-name github-token
```

#### 手動デプロイ
```bash
./scripts/deploy.sh
```

### 4. 手動設定（手動デプロイの場合）

1. **AWS Amplify Console** にアクセス
2. 作成されたAmplifyアプリを選択
3. **Connect repository** でGitHubリポジトリを接続
4. **Build settings** を設定:
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - cd frontend
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: frontend/.next
           files:
             - '**/*'
         cache:
           paths:
             - frontend/node_modules/**/*
       appRoot: frontend
   ```

5. **Environment variables** を設定:
   - `NEXT_PUBLIC_BACKEND_BASE_URL`: バックエンドURL
   - `NEXT_PUBLIC_BACKEND_PORT`: `80`
   - `NEXT_PUBLIC_API_VERSION`: `v2`
   - `NEXT_PUBLIC_ENABLE_V2_API`: `true`

## 設定

### 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `NEXT_PUBLIC_BACKEND_BASE_URL` | バックエンドAPI URL | 自動設定 |
| `NEXT_PUBLIC_BACKEND_PORT` | バックエンドポート | `80` |
| `NEXT_PUBLIC_API_VERSION` | API バージョン | `v2` |
| `NEXT_PUBLIC_ENABLE_V2_API` | V2 API有効化 | `true` |
| `NEXT_PUBLIC_DRY_RUN` | ドライランモード | `false` |

### カスタムドメイン

Amplifyでカスタムドメインを設定する場合：

1. **Domain management** でドメインを追加
2. DNS設定でCNAMEレコードを追加
3. SSL証明書は自動で設定されます

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドテスト
cd frontend
npm ci
npm run build
```

### CORS エラー

バックエンドのCORS設定を確認：
```python
# backend/config.py
FRONTEND_URL=https://your-amplify-domain.amplifyapp.com
```

### API接続エラー

1. バックエンドURLが正しく設定されているか確認
2. セキュリティグループでポート80が開いているか確認
3. ALBのヘルスチェックが通っているか確認

## 更新とデプロイ

### 自動デプロイ
GitHubにpushすると自動でAmplifyがビルド・デプロイします。

### 手動デプロイ
```bash
# CDKスタックの更新
cdk deploy UDRStack

# Amplifyアプリの再デプロイ
aws amplify start-job --app-id <app-id> --branch-name main --job-type RELEASE
```

## モニタリング

- **Amplify Console**: ビルドログとデプロイ状況
- **CloudWatch**: バックエンドのログとメトリクス
- **ECS Console**: コンテナの状態

## コスト最適化

- **Amplify**: 使用量ベース課金
- **ECS Fargate**: 必要に応じてタスク数を調整
- **ALB**: 不要時は削除可能

## セキュリティ

- **HTTPS**: Amplifyで自動設定
- **API Keys**: Secrets Managerで管理
- **VPC**: バックエンドは適切に分離

## 参考リンク

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)