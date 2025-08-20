const axios = require('axios');

const ORS_BASE_URL = 'https://api.openrouteservice.org';
const API_KEY = process.env.ORS_API_KEY;

class ORSService {
  constructor() {
    this.client = axios.create({
      baseURL: ORS_BASE_URL,
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async optimize(start, end, waypoints) {
    try {
      const jobs = waypoints.map((wp, index) => ({
        id: wp.id || index,
        location: [wp.lng, wp.lat]
      }));

      const vehicles = [{
        id: 1,
        start: [start.lng, start.lat],
        end: [end.lng, end.lat]
      }];

      const requestBody = {
        jobs: jobs,
        vehicles: vehicles,
        options: {
          g: true
        }
      };

      const response = await this.client.post('/optimization', requestBody);
      
      const solution = response.data;
      
      if (!solution.routes || solution.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = solution.routes[0];
      const steps = route.steps;
      
      const orderedIds = steps
        .filter(step => step.type === 'job')
        .map(step => step.job);

      let polylineGeoJson = null;
      if (route.geometry) {
        polylineGeoJson = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        };
      }

      return {
        orderedIds: orderedIds,
        polylineGeoJson: polylineGeoJson,
        totals: {
          distance: route.distance ? Math.round(route.distance / 1000 * 10) / 10 : null,
          duration: route.duration ? Math.round(route.duration / 60) : null
        }
      };

    } catch (error) {
      console.error('Optimization error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      if (!wp.lat || !wp.lng) {
        return res.status(400).json({
          error: `Waypoint ${i} must have lat/lng`
        });
      }
      if (wp.id === undefined) {
        wp.id = i;
      }
    }

    const orsService = new ORSService();
    const result = await orsService.optimize(start, end, waypoints);
    res.json(result);

  } catch (error) {
    console.error('Optimize route error:', error);
    res.status(500).json({
      error: 'Route optimization failed',
      message: error.message
    });
  }
}