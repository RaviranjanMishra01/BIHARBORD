const getLocation = async (clientIp) => {
  let lookupIp = clientIp || '127.0.0.1';

  // Normalize loopback IPv6 addresses
  if (lookupIp === '::1') {
    lookupIp = '127.0.0.1';
  }
  if (lookupIp.startsWith('::ffff:')) {
    lookupIp = lookupIp.substring(7);
  }

  // Detect loopbacks and private local subnets
  const isLocal = 
    lookupIp === '127.0.0.1' || 
    lookupIp.startsWith('192.168.') || 
    lookupIp.startsWith('10.') || 
    lookupIp.startsWith('172.16.') || 
    lookupIp.startsWith('172.31.');

  // If local server, resolve the client's public internet IP first
  if (isLocal) {
    try {
      const ipifyRes = await fetch('https://api.ipify.org?format=json');
      const ipifyData = await ipifyRes.json();
      if (ipifyData && ipifyData.ip) {
        lookupIp = ipifyData.ip;
      }
    } catch (err) {
      console.warn('[GeoIP] Localhost public IP check skipped:', err.message);
    }
  }

  try {
    // Retrieve geolocation details
    const geoRes = await fetch(`http://ip-api.com/json/${lookupIp}`);
    const geoData = await geoRes.json();
    if (geoData && geoData.status === 'success') {
      const { city, regionName, country } = geoData;
      return {
        ip: lookupIp,
        location: `${city}, ${regionName}, ${country}`
      };
    }
  } catch (err) {
    console.error('[GeoIP] Location API lookup failed:', err.message);
  }

  // Fallback if APIs are offline
  return {
    ip: lookupIp,
    location: 'Patna, Bihar, India'
  };
};

module.exports = getLocation;
