// Transit link generators for train route navigation

export class TransitLinkGenerator {
  static generateGoogleMapsLink(origin, destination) {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const params = new URLSearchParams({
      api: '1',
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      travelmode: 'transit'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  static generateNavitimeLink(origin, destination) {
    // NAVITIME Web search URL
    const baseUrl = 'https://www.navitime.co.jp/transit/searchlist';
    
    const params = new URLSearchParams({
      orvStationName: this.formatLocationForNavitime(origin),
      dnvStationName: this.formatLocationForNavitime(destination),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      basis: '1', // Departure time basis
      sort: '0'   // Sort by time
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  static formatLocationForNavitime(location) {
    // Format as "lat,lng" for NAVITIME
    return `${location.lat},${location.lng}`;
  }

  static generateYahooTransitLink(origin, destination) {
    // Yahoo! Transit (alternative option)
    const baseUrl = 'https://transit.yahoo.co.jp/search/result';
    
    const params = new URLSearchParams({
      from: `${origin.lat},${origin.lng}`,
      to: `${destination.lat},${destination.lng}`,
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
      hh: new Date().getHours().toString().padStart(2, '0'),
      mm: new Date().getMinutes().toString().padStart(2, '0')
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  static generateAllLinks(origin, destination) {
    return {
      google: this.generateGoogleMapsLink(origin, destination),
      navitime: this.generateNavitimeLink(origin, destination),
      yahoo: this.generateYahooTransitLink(origin, destination)
    };
  }
}

// Utility functions for transit route handling
export function openTransitRoute(origin, destination, provider = 'google') {
  let url;
  
  switch (provider.toLowerCase()) {
    case 'navitime':
      url = TransitLinkGenerator.generateNavitimeLink(origin, destination);
      break;
    case 'yahoo':
      url = TransitLinkGenerator.generateYahooTransitLink(origin, destination);
      break;
    case 'google':
    default:
      url = TransitLinkGenerator.generateGoogleMapsLink(origin, destination);
      break;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function createTransitButtons(origin, destination, containerElement) {
  const links = TransitLinkGenerator.generateAllLinks(origin, destination);
  
  const buttonsHTML = `
    <div class="transit-buttons">
      <button class="btn btn-sm btn-primary" onclick="window.open('${links.google}', '_blank')">
        🗺️ Google Maps
      </button>
      <button class="btn btn-sm btn-secondary" onclick="window.open('${links.navitime}', '_blank')">
        🚃 NAVITIME
      </button>
      <button class="btn btn-sm btn-outline" onclick="window.open('${links.yahoo}', '_blank')">
        🚉 Yahoo!乗換
      </button>
    </div>
  `;
  
  containerElement.innerHTML = buttonsHTML;
}

// React component helper for transit buttons
export function TransitButtons({ origin, destination, className = '' }) {
  const links = TransitLinkGenerator.generateAllLinks(origin, destination);
  
  const handleClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className={`transit-buttons ${className}`}>
      <button 
        className="btn btn-sm btn-primary"
        onClick={() => handleClick(links.google)}
        title="Google Mapsで電車ルートを表示"
      >
        🗺️ Google Maps
      </button>
      <button 
        className="btn btn-sm btn-secondary"
        onClick={() => handleClick(links.navitime)}
        title="NAVITIMEで電車ルートを表示"
      >
        🚃 NAVITIME
      </button>
      <button 
        className="btn btn-sm btn-outline"
        onClick={() => handleClick(links.yahoo)}
        title="Yahoo!乗換案内で電車ルートを表示"
      >
        🚉 Yahoo!乗換
      </button>
    </div>
  );
}