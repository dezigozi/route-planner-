 const express = require('express');
 const cors = require('cors');
 const path = require('path');
 require('dotenv').config();
 const geocodeRoutes = require('./server/routes/geocode');
 const optimizeRoutes = require('./server/routes/optimize');
 const app = express();
 const PORT = process.env.PORT || 3000;
