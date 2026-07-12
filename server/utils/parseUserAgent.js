const parseUserAgent = (uaString) => {
  if (!uaString) return 'Unknown Browser';
  
  let browser = 'Other Browser';
  let os = 'Unknown OS';

  // Basic browser matching
  if (uaString.includes('Firefox')) browser = 'Firefox';
  else if (uaString.includes('Chrome') || uaString.includes('CriOS')) browser = 'Chrome';
  else if (uaString.includes('Safari') && !uaString.includes('Chrome')) browser = 'Safari';
  else if (uaString.includes('Edg')) browser = 'Edge';
  else if (uaString.includes('MSIE') || uaString.includes('Trident')) browser = 'IE';

  // Basic OS matching
  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Macintosh') || uaString.includes('Mac OS')) os = 'macOS';
  else if (uaString.includes('Linux') && !uaString.includes('Android')) os = 'Linux';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

module.exports = parseUserAgent;
