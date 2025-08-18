const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const geocodeRoutes = require('./server/routes/geocode');
const optimizeRoutes = require('./server/routes/optimize');

const app = express();
const PORT = process.env.PORT || 3000;

// 環境変数チェック
console.log('=== 環境設定チェック ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', PORT);
console.log('ORS_API_KEY:', process.env.ORS_API_KEY ? 'Set ✓' : 'Not Set ✗');
if (!process.env.ORS_API_KEY) {
  console.warn('⚠️  OpenRouteService API キーが設定されていません。車モードが利用できません。');
  console.warn('   Secrets toolでORS_API_KEYを設定してください。');
}
console.log('========================');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/geocode', geocodeRoutes);
app.use('/api/optimize', optimizeRoutes);

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    orsApiKeyConfigured: !!process.env.ORS_API_KEY
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`App available at: http://localhost:${PORT}`);
  } else {
    console.log(`Backend API: http://localhost:${PORT}`);
    console.log(`Frontend Dev Server will start on port 5173`);
  }
});