const express = require('express');
const orsService = require('../services/ors');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({
        error: 'addresses array is required'
      });
    }

    if (addresses.length === 0) {
      return res.json([]);
    }

    if (addresses.length > 100) {
      return res.status(400).json({
        error: 'Too many addresses. Maximum 100 allowed per request.'
      });
    }

    const results = await orsService.geocode(addresses);
    res.json(results);

  } catch (error) {
    console.error('Geocode route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;