const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const geocodeRoutes = require('./server/routes/geocode');
const optimizeRoutes = require('./server/routes/optimize');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (for production)
app.use(express.static(path.join(__dirname, 'client/dist')));

// API routes
app.use('/api/geocode', geocodeRoutes);
app.use('/api/optimize', optimizeRoutes);

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!process.env.ORS_API_KEY) {
    console.warn('⚠️  ORS_API_KEY not set - car mode will not work');
  }
});

module.exports = server;
