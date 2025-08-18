import maplibregl from 'maplibre-gl';

export class MapManager {
  constructor(containerId) {
    this.map = new maplibregl.Map({
      container: containerId,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [139.6917, 35.6895], // Tokyo
      zoom: 10
    });

    this.markers = [];
    this.routeLayerId = 'route-layer';
    this.routeSourceId = 'route-source';
    
    this.map.on('load', () => {
      // Add route source and layer
      this.map.addSource(this.routeSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: this.routeLayerId,
        type: 'line',
        source: this.routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });
    });
  }

  clearAll() {
    // Remove all markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Clear route
    if (this.map.getSource(this.routeSourceId)) {
      this.map.getSource(this.routeSourceId).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  addNumberedPin(lat, lng, number, address, memo, isStart = false, isEnd = false) {
    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    let markerClass = 'marker-waypoint';
    let displayNumber = number;
    
    if (isStart) {
      markerClass = 'marker-start';
      displayNumber = 'S';
    } else if (isEnd) {
      markerClass = 'marker-end';
      displayNumber = 'E';
    }
    
    el.innerHTML = `
      <div class="${markerClass}">
        <span class="marker-number">${displayNumber}</span>
      </div>
    `;

    // Create popup
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div class="popup-content">
        <div class="popup-number">地点 ${displayNumber}</div>
        <div class="popup-address">${address}</div>
        ${memo ? `<div class="popup-memo">${memo}</div>` : ''}
      </div>
    `);

    // Create and add marker
    const marker = new maplibregl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(this.map);

    this.markers.push(marker);
    
    return marker;
  }

  drawRoute(geoJsonFeature) {
    if (!this.map.getSource(this.routeSourceId)) {
      return;
    }

    this.map.getSource(this.routeSourceId).setData({
      type: 'FeatureCollection',
      features: [geoJsonFeature]
    });
  }

  drawSimpleLine(coordinates) {
    if (!this.map.getSource(this.routeSourceId)) {
      return;
    }

    const lineFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      },
      properties: {}
    };

    this.map.getSource(this.routeSourceId).setData({
      type: 'FeatureCollection',
      features: [lineFeature]
    });
  }

  fitToBounds(locations) {
    if (locations.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    locations.forEach(location => {
      bounds.extend([location.lng, location.lat]);
    });

    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  }

  getMapElement() {
    return this.map.getContainer();
  }

  resize() {
    this.map.resize();
  }
}