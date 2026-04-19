// lib/apiClient.js
const API_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// Global auth error handler - can be set by consuming modules
let globalAuthErrorHandler = null;

/**
 * Set a global handler for authentication errors (401/TOKEN_EXPIRED)
 * @param {Function} handler - Callback function that receives the error
 */
export function setAuthErrorHandler(handler) {
  globalAuthErrorHandler = handler;
}

/**
 * Check if error is an authentication error that should trigger logout
 * @param {APIError} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  if (!(error instanceof APIError)) return false;
  return error.status === 401 || 
         error.code === 'TOKEN_EXPIRED' || 
         error.code === 'UNAUTHORIZED' ||
         error.code === 'INVALID_TOKEN' ||
         error.code === 'NO_TOKEN';
}

/**
 * Handle auth error by calling the global handler if set
 * @param {APIError} error
 */
export function handleAuthError(error) {
  if (globalAuthErrorHandler && isAuthError(error)) {
    globalAuthErrorHandler(error);
  }
}


// Request deduplication map
const pendingRequests = new Map();

async function fetchWithTimeout(url, options = {}, timeoutMs = API_CONFIG.timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new APIError('Request timed out', 408, 'TIMEOUT');
    }
    throw error;
  }
}

async function fetchWithRetry(url, options = {}, maxRetries = API_CONFIG.maxRetries) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on 4xx errors (client errors)
      if (!response.ok && response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}));
        const error = new APIError(
          errorData.message || 'Request failed',
          response.status,
          errorData.code || 'CLIENT_ERROR'
        );
        // Attach the full response data for detailed error handling
        error.response = { data: errorData };
        throw error;
      }
      
      if (!response.ok) {
        throw new APIError('Server error', response.status, 'SERVER_ERROR');
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors or timeout on last attempt
      if (error instanceof APIError && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}

// Request deduplication wrapper
export async function apiRequest(key, url, options = {}) {
  // Check if identical request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const requestPromise = fetchWithRetry(url, options)
    .then(async (response) => {
      const data = await response.json();
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });
  
  pendingRequests.set(key, requestPromise);
  return requestPromise;
}

// Input sanitization
export function sanitizeSearchParams(params) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      // Remove potential XSS vectors
      const cleanValue = String(value)
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 200); // Max length
      
      if (cleanValue) {
        sanitized[key] = cleanValue;
      }
    }
  }
  
  return sanitized;
}


/**
 * Universal API response validator
 * Supports both object and array payloads.
 */
export function validateResponse(data, schema = {}) {
  try {
    // 1️⃣ Handle raw array responses directly (e.g., search endpoints)
    if (Array.isArray(data)) {
      return data;
    }

    // 2️⃣ Basic structure validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    // 3️⃣ Apply lightweight "schema" checks for known shapes
    if (schema.medications && !Array.isArray(data.medications)) {
      data.medications = [];
    }

    if (schema.pharmacyRecommendations && !Array.isArray(data.pharmacyRecommendations)) {
      data.pharmacyRecommendations = [];
    }

    if (schema.results && Array.isArray(data.results)) {
      return data.results; // Support { results: [...] } pattern too ✅
    }

    // 4️⃣ Fallback: return object if nothing else matched
    return data;
  } catch (error) {
    console.error('Response validation failed:', error);
    throw new APIError('Invalid response format', 500, 'VALIDATION_ERROR');
  }
}