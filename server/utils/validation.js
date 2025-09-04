export const validateUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's HTTP or HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check if hostname exists
    if (!parsedUrl.hostname) {
      return { valid: false, error: 'Invalid hostname' };
    }

    // Block localhost and private IPs for security
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.includes('0.0.0.0')) {
      return { valid: false, error: 'Private and local URLs are not allowed' };
    }

    return { valid: true, url: parsedUrl.toString() };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const validateBotType = (botType) => {
  const validTypes = ['navigation', 'qa', 'whatsapp', 'support', 'general'];
  return validTypes.includes(botType);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};