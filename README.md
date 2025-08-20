# Route Planner App

Excel住所リストから最適訪問順を計算するアプリ（車・電車対応）

## 🚀 主な機能

- **車モード**: OpenRouteService(ORS)を使用した本格的なルート最適化
- **電車モード**: 距離ベースTSP + 電車ルート検索リンク生成（Google Maps / NAVITIME）
- **Excel読み込み**: 住所、訪問先、メモなどの一括取り込み
- **地図表示**: MapLibre GL JS による番号付きピンと最適ルートの可視化
- **PDF出力**: 地図と訪問順序一覧を含む印刷可能なレポート

## 🚀 Vercel での自動デプロイ

### 1. GitHubリポジトリのセットアップ

```bash
# Gitリポジトリを初期化
git init
git add .
git commit -m "Initial commit"

# GitHubリモートを追加
git remote add origin https://github.com/your-username/route-planner.git
git push -u origin main
```

### 2. Vercelでのデプロイ

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "New Project" をクリック
3. GitHubリポジトリをインポート
4. プロジェクト設定:
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

### 3. 環境変数の設定

Vercel ダッシュボードで以下の環境変数を追加:

- `ORS_API_KEY`: OpenRouteService API キー ([取得方法](https://openrouteservice.org/dev/#/signup))
- `NODE_ENV`: `production`

### 4. 自動デプロイ

GitHubにpushするたびに自動的にデプロイされます:
```bash
git add .
git commit -m "Update application"
git push origin main
```

デプロイ後のURL: `https://your-project-name.vercel.app`

## 💻 ローカル開発

```bash
# 依存関係のインストール
npm install
npm run install:client

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📊 Excel ファイル形式

| 列名 | 必須 | 説明 |
|------|------|------|
| 住所 | ✓ | 訪問先の住所 |
| 訪問先 | - | 施設名・会社名など |
| メモ | - | 備考・詳細情報 |

### サンプルデータ
```csv
住所,訪問先,メモ
"東京都渋谷区渋谷2-21-1","渋谷ヒカリエ","会議"
"東京都新宿区西新宿2-8-1","東京都庁","手続き"
"東京都千代田区丸の内1-6-1","丸の内オアゾ","打ち合わせ"
```

## 🏗️ アーキテクチャ

### Vercel Production
```
api/                     # Vercel Serverless Functions
├── geocode.js          # 住所→座標変換 API
└── optimize.js         # 車ルート最適化 API
client/dist/            # 静的ファイル（React build）
vercel.json             # Vercel設定
```

### Development
```
server/                 # Express サーバー (開発用)
├── routes/            # API エンドポイント
└── services/          # OpenRouteService連携
client/src/            # React アプリケーション
```

## 🔧 技術スタック

- **フロントエンド**: React, Vite, MapLibre GL JS
- **バックエンド**: Vercel Serverless Functions / Node.js Express
- **地図**: OpenStreetMap + MapLibre
- **ルーティング**: OpenRouteService API
- **Excel解析**: SheetJS (xlsx)
- **PDF出力**: html2pdf.js
- **デプロイ**: Vercel

## 📱 API エンドポイント

- `POST /api/geocode` - 住所のジオコーディング
- `POST /api/optimize` - 車ルートの最適化
