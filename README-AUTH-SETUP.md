# 認証機能セットアップガイド

## 必要な環境変数

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/owllearn_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Provider
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Existing APIs
GOOGLE_CLOUD_API_KEY="your-google-cloud-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. APIs & Services > Credentials に移動
4. 「Create Credentials」> 「OAuth 2.0 Client IDs」を選択
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Client IDとClient Secretを取得

## メール認証設定

### Gmail使用の場合：

1. Gmailアカウントで2段階認証を有効化
2. App passwordを生成
3. 生成されたApp passwordを `EMAIL_SERVER_PASSWORD` に設定

### 他のメールプロバイダー：

- SMTP設定を適切に調整してください

## データベース設定

### PostgreSQL使用の場合：

1. PostgreSQLをインストール
2. データベースを作成
3. `DATABASE_URL` を適切に設定

### SQLite使用の場合（開発用）：

```bash
DATABASE_URL="file:./dev.db"
```

## セットアップ手順

1. 環境変数を設定
2. データベースマイグレーションを実行：
   ```bash
   npx prisma migrate dev --name add_auth_tables
   ```
3. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

## 実装された機能

- ✅ メールアドレスでの登録・ログイン
- ✅ Google OAuth認証
- ✅ 学習記録のアカウント保存
- ✅ ローカルストレージからの自動移行
- ✅ セッション管理
- ✅ 保護されたルート

## 注意点

- 本番環境では適切なセキュリティ設定を行ってください
- メール認証にはSMTPサーバーが必要です
- Google OAuth認証には本番ドメインの認証が必要です
- データベースの定期的なバックアップを推奨します 