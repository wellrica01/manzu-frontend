/**
 * API Utilities and Helper Functions
 * Place this in: utils/api.js or lib/api.js
 */

// Constants
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second base delay
  DEBOUNCE_DELAY: 300
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred.',
  VALIDATION_ERROR: 'Invalid data provided.'
};

// Error classes for better error handling
export class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = ERROR_MESSAGES.TIMEOUT) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Delay utility for retries
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounce function
 */
export const debounce = (func, wait = API_CONFIG.DEBOUNCE_DELAY) => {
  let timeout;
  
  const debouncedFn = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  debouncedFn.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debouncedFn;
};

/**
 * Throttle function - ensures function executes at most once per interval
 */
export const throttle = (func, limit = API_CONFIG.DEBOUNCE_DELAY) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Fetch with timeout
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = API_CONFIG.TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw new NetworkError(error.message);
  }
};

/**
 * Fetch with retry logic and exponential backoff
 */
export const fetchWithRetry = async (
  url, 
  options = {}, 
  maxRetries = API_CONFIG.MAX_RETRIES,
  baseDelay = API_CONFIG.RETRY_DELAY
) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on server errors (5xx) or rate limit
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: delay * 2^attempt
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
};

/**
 * Parse API error response
 */
export const parseAPIError = async (response) => {
  let errorMessage = ERROR_MESSAGES.UNKNOWN;
  let details = null;
  
  try {
    const data = await response.json();
    errorMessage = data.message || data.error || errorMessage;
    details = data.details || data.errors || null;
  } catch (e) {
    // If JSON parsing fails, use status text
    errorMessage = response.statusText || errorMessage;
  }
  
  // Map status codes to user-friendly messages
  switch (response.status) {
    case 400:
      errorMessage = details ? errorMessage : ERROR_MESSAGES.VALIDATION_ERROR;
      break;
    case 401:
      errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
      break;
    case 404:
      errorMessage = ERROR_MESSAGES.NOT_FOUND;
      break;
    case 500:
    case 502:
    case 503:
      errorMessage = ERROR_MESSAGES.SERVER_ERROR;
      break;
  }
  
  return new APIError(errorMessage, response.status, details);
};

/**
 * Make API call with full error handling
 */
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetchWithRetry(url, options);
    
    if (!response.ok) {
      throw await parseAPIError(response);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('API call failed:', error);
    return { data: null, error };
  }
};

/**
 * Build query string from object
 */
export const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return queryParams.toString();
};

/**
 * Validate required fields
 */
export const validateRequired = (data, requiredFields) => {
  const missing = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format currency (Naira)
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₦0';
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

/**
 * Format distance
 */
export const formatDistance = (distance) => {
  if (typeof distance !== 'number' || isNaN(distance) || distance < 0) {
    return 'Distance N/A';
  }
  return `${distance.toFixed(1)} km away`;
};

/**
 * Validate distance
 */
export const isValidDistance = (distance) => {
  return typeof distance === 'number' && !isNaN(distance) && distance >= 0;
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Request queue for managing concurrent requests
 */
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }
  
  async add(fn) {
    while (this.current >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.current++;
    
    try {
      return await fn();
    } finally {
      this.current--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

export const requestQueue = new RequestQueue(3);

/**
 * Haversine distance calculation
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Reverse geocoding helper
 */
export function reverseGeocode(userLat, userLng, geoData) {
  if (!geoData?.length || !userLat || !userLng) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  geoData.forEach((state) => {
    if (!state?.lgas) return;
    
    state.lgas.forEach((lga) => {
      const lgaCoords = lga.wards?.map(w => [w.latitude, w.longitude]).filter(c => c[0] && c[1]) || [];
      if (lgaCoords.length === 0) return;
      
      const avgLat = lgaCoords.reduce((sum, [lat]) => sum + lat, 0) / lgaCoords.length;
      const avgLng = lgaCoords.reduce((sum, [, lng]) => sum + lng, 0) / lgaCoords.length;
      const dist = haversineDistance(userLat, userLng, avgLat, avgLng);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { state: state.state, lga: lga.name, distance: dist };
      }
    });
  });
  
  return nearest;
}

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Nigerian format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Batch requests to avoid rate limiting
 */
export class RequestBatcher {
  constructor(batchSize = 5, delayBetweenBatches = 100) {
    this.batchSize = batchSize;
    this.delayBetweenBatches = delayBetweenBatches;
  }

  async executeBatch(requests) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += this.batchSize) {
      const batch = requests.slice(i, i + this.batchSize);
      const batchResults = await Promise.allSettled(batch.map(req => req()));
      results.push(...batchResults);
      
      if (i + this.batchSize < requests.length) {
        await delay(this.delayBetweenBatches);
      }
    }
    
    return results;
  }
}

/**
 * Error boundary logger
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
  
  console.error('Error logged:', errorInfo);
  
  // Send to error tracking service (Sentry, LogRocket, etc.)
  if (typeof window !== 'undefined' && window.errorTracker) {
    window.errorTracker.log(errorInfo);
  }
  
  return errorInfo;
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
  }

  start(label) {
    this.marks.set(label, performance.now());
  }

  end(label) {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`);
      return null;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Cache manager with TTL
 */
export class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheManager();

// Run cache cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

