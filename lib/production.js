// utils/production.js - Production-ready utility functions

/**
 * Logger utility - replaces console.log in production
 */
export const logger = {
  info: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
    // In production, send to logging service
    // Example: Sentry, LogRocket, Datadog, etc.
  },
  
  error: (message, error, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error, context);
    }
    
    // Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { context: message },
        extra: context
      });
    }
  },
  
  warn: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data);
    }
  }
};

/**
 * Analytics tracking wrapper
 */
export const analytics = {
  track: (eventName, properties = {}) => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return;
    }
    
    try {
      // Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, properties);
      }
      
      // Mixpanel
      if (typeof window !== 'undefined' && window.mixpanel) {
        window.mixpanel.track(eventName, properties);
      }
      
      logger.info(`Analytics: ${eventName}`, properties);
    } catch (error) {
      logger.error('Analytics tracking failed', error, { eventName, properties });
    }
  },
  
  page: (pageName, properties = {}) => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return;
    }
    
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: pageName,
          ...properties
        });
      }
      
      logger.info(`Page view: ${pageName}`, properties);
    } catch (error) {
      logger.error('Page tracking failed', error, { pageName, properties });
    }
  },
  
  identify: (userId, traits = {}) => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return;
    }
    
    try {
      if (typeof window !== 'undefined' && window.mixpanel) {
        window.mixpanel.identify(userId);
        window.mixpanel.people.set(traits);
      }
      
      logger.info('User identified', { userId, traits });
    } catch (error) {
      logger.error('User identification failed', error, { userId });
    }
  }
};

/**
 * Performance monitoring
 */
export const performance = {
  mark: (markName) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(markName);
    }
  },
  
  measure: (measureName, startMark, endMark) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(measureName, startMark, endMark);
        const measure = window.performance.getEntriesByName(measureName)[0];
        
        logger.info(`Performance: ${measureName}`, {
          duration: measure.duration,
          startTime: measure.startTime
        });
        
        return measure.duration;
      } catch (error) {
        logger.error('Performance measurement failed', error, { measureName });
      }
    }
  },
  
  reportWebVitals: (metric) => {
    if (process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS !== 'true') {
      return;
    }
    
    const { name, value, id } = metric;
    
    // Send to analytics
    analytics.track('web_vital', {
      metric_name: name,
      metric_value: value,
      metric_id: id
    });
    
    logger.info(`Web Vital: ${name}`, { value, id });
  }
};

/**
 * Feature flag checker
 */
export const featureFlags = {
  isEnabled: (featureName) => {
    const envVar = `NEXT_PUBLIC_ENABLE_${featureName.toUpperCase()}`;
    return process.env[envVar] === 'true';
  }
};

/**
 * Safe localStorage wrapper
 */
export const storage = {
  get: (key, defaultValue = null) => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.error('localStorage get failed', error, { key });
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    if (typeof window === 'undefined') return false;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('localStorage set failed', error, { key });
      return false;
    }
  },
  
  remove: (key) => {
    if (typeof window === 'undefined') return false;
    
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('localStorage remove failed', error, { key });
      return false;
    }
  }
};

/**
 * API error handler
 */
export const handleApiError = (error, context = '') => {
  const errorData = {
    message: error.message || 'Unknown error',
    status: error.response?.status,
    data: error.response?.data,
    context
  };
  
  logger.error('API Error', error, errorData);
  
  // User-friendly error messages
  if (error.response?.status === 404) {
    return 'Resource not found';
  } else if (error.response?.status === 401) {
    return 'Please log in to continue';
  } else if (error.response?.status === 403) {
    return 'You don\'t have permission to access this';
  } else if (error.response?.status >= 500) {
    return 'Server error. Please try again later';
  } else if (!navigator.onLine) {
    return 'No internet connection. Please check your network';
  }
  
  return error.message || 'Something went wrong. Please try again';
};

/**
 * Debounce function for performance
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll handlers
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Image optimization helper
 */
export const getOptimizedImageUrl = (url, width = 1920, quality = 85) => {
  if (!url) return '/images/placeholder.jpg';
  
  // If using Supabase or custom CDN with image transformation
  if (url.includes('supabase.co')) {
    return `${url}?width=${width}&quality=${quality}`;
  }
  
  return url;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +234 XXX XXX XXXX
  if (cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  return phone;
};

/**
 * Validate environment variables on startup
 */
export const validateEnvironment = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', new Error('ENV_MISSING'), {
      missing
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  return true;
};

/**
 * Rate limiter for client-side requests
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  canMakeRequest(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests outside the window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { key, count: recentRequests.length });
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  reset(key) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000
);

/**
 * Retry logic for failed requests
 */
export const retryRequest = async (
  requestFn,
  maxRetries = 3,
  delay = 1000,
  backoff = 2
) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(backoff, i);
        logger.info(`Retrying request in ${waitTime}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  logger.error('Request failed after retries', lastError, { maxRetries });
  throw lastError;
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('JSON parse failed', error, { jsonString: jsonString?.substring(0, 100) });
    return defaultValue;
  }
};

/**
 * Generate unique ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
};

/**
 * Cookie utilities (for SSR-safe operations)
 */
export const cookies = {
  get: (name) => {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    
    return null;
  },
  
  set: (name, value, days = 365) => {
    if (typeof document === 'undefined') return false;
    
    try {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict;Secure`;
      return true;
    } catch (error) {
      logger.error('Cookie set failed', error, { name });
      return false;
    }
  },
  
  remove: (name) => {
    if (typeof document === 'undefined') return false;
    
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      return true;
    } catch (error) {
      logger.error('Cookie remove failed', error, { name });
      return false;
    }
  }
};

/**
 * Check if user is online
 */
export const isOnline = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

/**
 * Device detection
 */
export const device = {
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },
  
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },
  
  isIOS: () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },
  
  isAndroid: () => {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'NGN') => {
  if (typeof amount !== 'number') return '₦0.00';
  
  const formatters = {
    NGN: new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }),
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  };
  
  const formatter = formatters[currency] || formatters.NGN;
  return formatter.format(amount);
};

/**
 * Format date
 */
export const formatDate = (date, format = 'long') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    logger.error('Invalid date', new Error('INVALID_DATE'), { date });
    return '';
  }
  
  const formats = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    full: { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };
  
  return new Intl.DateTimeFormat('en-NG', formats[format] || formats.long)
    .format(dateObj);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove script tags and potentially dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Nigerian format)
 */
export const isValidPhoneNumber = (phone) => {
  // Nigerian phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX
  const phoneRegex = /^(\+234|0)[7-9][0-1]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  if (typeof navigator === 'undefined') return false;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } catch (error) {
        logger.error('Clipboard copy failed', error);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (error) {
    logger.error('Clipboard copy failed', error);
    return false;
  }
};

/**
 * Share content (Web Share API)
 */
export const shareContent = async (data) => {
  if (typeof navigator === 'undefined' || !navigator.share) {
    logger.warn('Web Share API not supported');
    return false;
  }
  
  try {
    await navigator.share(data);
    analytics.track('content_shared', { type: data.title });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      logger.error('Share failed', error);
    }
    return false;
  }
};

/**
 * Initialize production utilities
 */
export const initProduction = () => {
  // Validate environment
  validateEnvironment();
  
  // Setup error tracking
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Initialize Sentry or other error tracking
    logger.info('Error tracking initialized');
  }
  
  // Setup analytics
  if (featureFlags.isEnabled('ANALYTICS')) {
    logger.info('Analytics initialized');
  }
  
  // Log environment info in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('Environment', {
      NODE_ENV: process.env.NODE_ENV,
      features: {
        whatsapp: featureFlags.isEnabled('WHATSAPP'),
        ussd: featureFlags.isEnabled('USSD'),
        analytics: featureFlags.isEnabled('ANALYTICS')
      }
    });
  }
  
  return true;
};

const productionUtils = {
  logger,
  analytics,
  performance,
  featureFlags,
  storage,
  handleApiError,
  debounce,
  throttle,
  getOptimizedImageUrl,
  formatPhoneNumber,
  validateEnvironment,
  rateLimiter,
  retryRequest,
  safeJSONParse,
  generateId,
  cookies,
  isOnline,
  device,
  formatCurrency,
  formatDate,
  sanitizeInput,
  isValidEmail,
  isValidPhoneNumber,
  copyToClipboard,
  shareContent,
  initProduction
};

export default productionUtils;
