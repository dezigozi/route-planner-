# ルート最適化アプリ

Excelの住所リストから最適な訪問順序を計算し、車・電車両方のモードに対応したルート最適化アプリです。

## 🚀 主な機能

- **車モード**: OpenRouteService(ORS)を使用した本格的なルート最適化
- **電車モード**: 距離ベースTSP + 電車ルート検索リンク生成（Google Maps / NAVITIME）
- **Excel読み込み**: 住所、訪問先、メモなどの一括取り込み
- **地図表示**: MapLibre GL JS による番号付きピンと最適ルートの可視化
- **PDF出力**: 地図と訪問順序一覧を含む印刷可能なレポート

## 📋 必要な環境

- Node.js 16+
- OpenRouteService API キー（車モード用）

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
cd client && npm install && cd ..
```

### 2. 環境変数の設定

`.env.sample`を`.env`にコピーし、OpenRouteService API キーを設定：

```bash
cp .env.sample .env
```

`.env`ファイルを編集：
```env
ORS_API_KEY=your_openrouteservice_api_key_here
PORT=3000
```

### OpenRouteService API キーの取得方法

1. [OpenRouteService](https://openrouteservice.org/dev/#/signup) にアカウント登録
2. API キーを取得（無料プランで1日2000リクエスト）
3. 上記の`.env`ファイルに設定

## 🚀 起動方法

### 開発環境
```bash
npm run dev
```
サーバ（http://localhost:3000）とクライアント（http://localhost:5173）が同時起動

### 本番環境
```bash
npm run build
npm start
```

## 📊 Excel ファイル形式

| 列名（例） | 必須 | 説明 |
|------------|------|------|
| 住所 | ✓ | 訪問先の住所 |
| 訪問先 | - | 施設名・会社名など |
| メモ | - | 備考・詳細情報 |
| 滞在分 | - | 滞在予定時間（数値） |
| 希望到着時刻 | - | HH:MM 形式 |

### サンプルデータ
```
住所,訪問先,メモ
"東京都渋谷区渋谷2-21-1","渋谷ヒカリエ","会議"
"東京都新宿区西新宿2-8-1","東京都庁","手続き"
"東京都千代田区丸の内1-6-1","丸の内オアゾ","打ち合わせ"
```

## 🎯 使用方法

1. **モード選択**: 車🚗 または 電車🚃 を選択
2. **出発地・ゴール地**: 住所を入力
3. **Excelファイル**: 訪問先住所リストをアップロード
4. **開始**: 最適ルートを計算・表示
5. **PDF出力**: 結果をA4サイズで保存

### 車モード
- OpenRouteServiceの最適化APIを使用
- 実際の道路距離と所要時間で最短ルートを計算
- 地図上に詳細なルートライン表示

### 電車モード  
- 距離マトリクス（直線距離 or 徒歩OSRM）からTSPアルゴリズムで順序最適化
- 各区間に電車ルート検索リンクを生成
- Google Maps Transit / NAVITIME / Yahoo!乗換案内に対応

## 🏗️ アーキテクチャ

### バックエンド (Express)
```
server.js                 # メインサーバー
server/routes/            # APIエンドポイント
  ├── geocode.js         # 住所→座標変換
  └── optimize.js        # 車ルート最適化
server/services/
  └── ors.js             # OpenRouteService連携
```

### フロントエンド (React + Vite)
```
client/src/
  ├── App.jsx            # メインコンポーネント
  ├── map.js             # MapLibre GL JS ラッパー
  ├── excel.js           # SheetJS Excel解析
  ├── tsp.js             # TSPソルバー（電車モード）
  ├── transit.js         # 電車ルートリンク生成
  ├── pdf.js             # html2pdf.js ラッパー
  ├── utils.js           # ユーティリティ関数
  └── index.css          # スタイル定義
```

## 🔧 技術スタック

- **フロントエンド**: React, Vite, MapLibre GL JS
- **バックエンド**: Node.js, Express
- **地図**: OpenStreetMap + MapLibre
- **ルーティング**: OpenRouteService API
- **Excel解析**: SheetJS (xlsx)
- **PDF出力**: html2pdf.js
- **最適化**: 2-opt TSPアルゴリズム（電車モード）

## 📱 レスポンシブ対応

モバイルデバイスでも使いやすいよう、画面サイズに応じてレイアウトが調整されます。

## 🚨 制限事項

- 車モード: OpenRouteService APIの利用制限（無料プランは1日2000リクエスト）
- 電車モード: 実際の電車時刻表は使用せず、距離ベースの近似計算
- ジオコーディング: 日本の住所に最適化済み

## 🎨 カスタマイズ

### 距離計算方法の変更（電車モード）
`client/src/tsp.js`の`TSPSolver`コンストラクタで距離マトリクス関数を指定：

```javascript
// 直線距離（デフォルト）
const tsp = new TSPSolver();

// OSRM徒歩距離
import { osrmDistanceMatrix } from './tsp.js';
const tsp = new TSPSolver(osrmDistanceMatrix);
```

### 地図スタイルの変更
`client/src/map.js`のMapLibre設定を編集してタイルソースやスタイルを変更可能。

## 🐛 トラブルシューティング

### よくある問題

1. **地図が表示されない**
   - ブラウザの開発者ツールでMapLibre関連エラーを確認
   - CSS読み込みを確認

2. **ジオコーディングが失敗する**
   - ORS API キーが正しく設定されているか確認
   - APIクォータの残量を確認

3. **Excelファイルが読み込めない**
   - ファイル形式が .xlsx または .xls であることを確認
   - 必須列「住所」が含まれていることを確認

## 📄 ライセンス

MIT License

## 🤝 貢献

Pull Request や Issue での貢献を歓迎します。

## 📞 サポート

技術的な問題や改善提案がございましたら、GitHub Issues でお知らせください。