# 🔧 Replit修正手順

## 1. 修正ファイルの置き換え

以下の3つのファイルをReplitプロジェクトの**ルートフォルダ**に上書きしてください：

- `package.json` - メインファイルとスクリプトを修正
- `.replit` - Replitの実行設定を修正  
- `index.js` - エントリーポイントを修正

## 2. 環境変数の設定

Replitで以下を設定：
1. **Settings** → **Environment variables**
2. **+ Add environment variable**
3. **Key**: `ORS_API_KEY`
4. **Value**: あなたのOpenRouteService APIキー

## 3. 依存関係のインストール

Replitの**Shell**タブで以下を実行：

```bash
# ルート依存関係をインストール
npm install

# クライアント依存関係をインストール  
cd client
npm install
cd ..
```

## 4. アプリの起動

**Run**ボタンを押すか、Shellで以下を実行：

```bash
npm start
```

## 5. 動作確認

- コンソールに「🚀 ルート最適化アプリを起動中...」が表示される
- ブラウザでアプリが表示される
- 地図が正常に読み込まれる

## トラブルシューティング

### エラーが出る場合
1. **Shell**で`npm install`を再実行
2. 環境変数`ORS_API_KEY`が正しく設定されているか確認
3. Replitを一度停止して再起動

### 車モードが動かない場合
- OpenRouteService APIキーが正しく設定されているか確認
- 電車モードは APIキー不要で動作可能