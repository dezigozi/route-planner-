// Replit用メインエントリーポイント
// 環境変数とポート設定を確認してからサーバーを起動

console.log('🚀 ルート最適化アプリを起動中...');

// 環境変数の確認
if (!process.env.ORS_API_KEY) {
  console.warn('⚠️  ORS_API_KEY が設定されていません。車モードが利用できません。');
  console.log('Settings → Environment variables で ORS_API_KEY を設定してください。');
}

// ポート設定
const PORT = process.env.PORT || 3000;
process.env.PORT = PORT;

console.log(`📡 サーバーはポート ${PORT} で起動します`);

// サーバーを起動
require('./server.js');