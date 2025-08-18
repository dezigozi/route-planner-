const express = require('express');
const orsService = require('../services/ors');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { start, end, waypoints } = req.body;
    
    if (!start || !start.lat || !start.lng) {
      return res.status(400).json({
        error: 'start location with lat/lng is required'
      });
    }

    if (!end || !end.lat || !end.lng) {
      return res.status(400).json({
        error: 'end location with lat/lng is required'
      });
    }

    if (!waypoints || !Array.isArray(waypoints)) {
      return res.status(400).json({
        error: 'waypoints array is required'
      });
    }

    if (waypoints.length === 0) {
      return res.json({
        orderedIds: [],
        polylineGeoJson: null,
        totals: { distance: 0, duration: 0 }
      });
    }

    if (waypoints.length > 50) {
      return res.status(400).json({
        error: 'Too many waypoints. Maximum 50 allowed per request.'
      });
    }

    // Validate waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      if (!wp.lat || !wp.lng) {
        return res.status(400).json({
          error: `Waypoint ${i} must have lat/lng`
        });
      }
      if (wp.id === undefined) {
        wp.id = i; // Assign default ID if not provided
      }
    }

    const result = await orsService.optimize(start, end, waypoints);
    res.json(result);

  } catch (error) {
    console.error('Optimize route error:', error);
    res.status(500).json({
      error: 'Route optimization failed',
      message: error.message
    });
  }
});

module.exports = router;