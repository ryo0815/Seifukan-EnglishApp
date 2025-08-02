# API セットアップガイド

## 500エラーの解決方法

アプリで500エラーが発生している場合、APIキーが設定されていない可能性があります。以下の手順で環境変数を設定してください。

## 1. 環境変数ファイルの作成

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の内容を追加してください：

```bash
# Google Cloud Speech-to-Text API Key
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here

# OpenAI API Key  
OPENAI_API_KEY=your_openai_api_key_here

# Database URL (if using Prisma)
DATABASE_URL="file:./dev.db"

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## 2. 開発サーバーの再起動

環境変数を追加した後、開発サーバーを再起動してください：

```bash
npm run dev
```

## 3. APIエンドポイントの確認

以下のAPIエンドポイントが正常に動作することを確認してください：

- `/api/speech/transcribe` - 音声をテキストに変換
- `/api/speech/evaluate` - AI による発音評価
- `/api/speech/analyze-audio` - 音響特徴分析

## 4. フォールバック機能

APIが利用できない場合でも、以下の機能は動作します：

- **クライアントサイド音響分析**: Web Audio API を使用した基本的な音響分析
- **オフライン評価**: サーバーAPIが利用できない場合の代替評価システム
- **音声再生**: Web Speech API を使用したお手本音声

## 5. トラブルシューティング

### 500エラーが続く場合

1. `.env.local` ファイルがプロジェクトルートに存在することを確認
2. APIキーが正しく設定されていることを確認
3. 開発サーバーを完全に停止して再起動
4. ブラウザのキャッシュをクリア

### APIキーが無効な場合

- Google Cloud APIキーの有効性を確認
- OpenAI APIキーの有効性を確認
- APIキーの使用制限や請求設定を確認

### ネットワークエラーの場合

- インターネット接続を確認
- ファイアウォールやプロキシ設定を確認
- APIエンドポイントへのアクセス権限を確認

## 6. 開発モード

開発中は以下のフォールバック機能が有効になります：

```javascript
// クライアントサイドのみの評価
const fallbackEvaluation = {
  pronunciationScore: 75,
  clarityScore: 80,
  fluencyScore: 70,
  overallScore: 75,
  feedback: "音響分析完了！引き続き練習を続けてください。",
  improvements: ["より明確な発音を心がけましょう"],
  positives: ["発音練習に取り組んでいます"]
}
```

これにより、APIが利用できない場合でも基本的な発音練習は継続できます。 