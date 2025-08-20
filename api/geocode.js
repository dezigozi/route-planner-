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

  async geocode(addresses) {
    const results = [];
    
    for (const address of addresses) {
      try {
        await this.delay(100);
        
        const response = await this.client.get('/geocode/search', {
          params: {
            text: address.trim(),
            size: 5,
            'boundary.country': 'JP'
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const orsService = new ORSService();
    const results = await orsService.geocode(addresses);
    res.json(results);

  } catch (error) {
    console.error('Geocode route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}