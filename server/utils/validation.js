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
    .replace(/[^\w\s\-_.]/g, '') // Keep only safe characters
    .substring(0, 200); // Limit length
};

export const validateChatMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }

  return { valid: true, message: message.trim() };
};