const axios = require('axios');

const ORS_BASE_URL = 'https://api.openrouteservice.org';
const API_KEY = process.env.ORS_API_KEY;

if (!API_KEY) {
  console.error('🚨 ORS_API_KEY環境変数が設定されていません。');
  console.error('   OpenRouteServiceのAPIキーをSecrets toolで設定してください。');
  console.error('   設定方法: https://openrouteservice.org/dev/#/signup');
}

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

  async geocode(addresses) {
    const results = [];
    
    for (const address of addresses) {
      try {
        await this.delay(100); // Rate limiting
        
        const response = await this.client.get('/geocode/search', {
          params: {
            text: address.trim(),
            size: 5, // Get top 5 candidates
            'boundary.country': 'JP' // Focus on Japan
          }
        });

        const features = response.data.features || [];
        
        if (features.length > 0) {
          const primary = features[0];
          const result = {
            address: address,
            lat: primary.geometry.coordinates[1],
            lng: primary.geometry.coordinates[0],
            formatted_address: primary.properties.label
          };

          // Add candidates if multiple results
          if (features.length > 1) {
            result.candidates = features.slice(1).map(f => ({
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              formatted_address: f.properties.label,
              confidence: f.properties.confidence || 0
            }));
          }

          results.push(result);
        } else {
          results.push({
            address: address,
            error: 'No results found'
          });
        }
      } catch (error) {
        console.error(`Geocoding error for "${address}":`, error.message);
        results.push({
          address: address,
          error: error.message
        });
      }
    }

    return results;
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
          g: true // Return geometry
        }
      };

      const response = await this.client.post('/optimization', requestBody);
      
      const solution = response.data;
      
      if (!solution.routes || solution.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = solution.routes[0];
      const steps = route.steps;
      
      // Extract ordered waypoint IDs
      const orderedIds = steps
        .filter(step => step.type === 'job')
        .map(step => step.job);

      // Get geometry for route visualization
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
          distance: route.distance ? Math.round(route.distance / 1000 * 10) / 10 : null, // km
          duration: route.duration ? Math.round(route.duration / 60) : null // minutes
        }
      };

    } catch (error) {
      console.error('Optimization error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ORSService();