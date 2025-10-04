// cartApi.js - Centralized API service for cart operations

// Constants
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Validate API URL on initialization
const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    console.error('NEXT_PUBLIC_API_URL is not defined');
    return '';
  }
  return url;
})();

/**
 * Exponential backoff retry utility
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, baseDelay = RETRY_DELAY) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Base fetch wrapper with timeout and error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch cart data
 * @param {Function} fetchCartFn - The cart fetch function from useCart hook
 * @returns {Promise<void>}
 */
export async function fetchCartData(fetchCartFn) {
  if (!API_URL) {
    throw new Error('API URL is not configured');
  }

  return retryWithBackoff(async () => {
    await fetchCartFn();
  });
}

/**
 * Load prescription statuses for medications
 * @param {string} guestId - Guest user ID
 * @param {Array} medicationIds - Array of medication IDs
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} - Prescription statuses object
 */
export async function loadPrescriptionStatuses(guestId, medicationIds, signal = null) {
  if (!API_URL || !guestId || !medicationIds || medicationIds.length === 0) {
    return {};
  }

  try {
    const medicationIdsStr = Array.isArray(medicationIds) 
      ? medicationIds.join(',') 
      : medicationIds;

    const url = `${API_URL}/api/cart/prescription/status?medicationIds=${medicationIdsStr}`;
    
    const response = await fetch(url, {
      headers: { 'x-guest-id': guestId },
      signal: signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch prescription statuses');
    }

    const statusData = await response.json();
    return statusData || {};
  } catch (error) {
    if (error.name === 'AbortError') {
      return {};
    }
    console.error('Failed to load prescription statuses:', error);
    throw error;
  }
}

/**
 * Poll prescription statuses
 * @param {string} guestId - Guest user ID
 * @param {Array} medicationIds - Array of medication IDs
 * @returns {Promise<Object>} - Updated prescription statuses
 */
export async function pollPrescriptionStatuses(guestId, medicationIds) {
  if (!API_URL || !guestId || !medicationIds || medicationIds.length === 0) {
    return {};
  }

  try {
    const medicationIdsStr = Array.isArray(medicationIds) 
      ? medicationIds.join(',') 
      : medicationIds;

    const url = `${API_URL}/api/cart/prescription/status?medicationIds=${medicationIdsStr}`;
    
    const response = await fetch(url, {
      headers: { 'x-guest-id': guestId },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      return {};
    }

    const statusData = await response.json();
    return statusData || {};
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Polling error:', error);
    }
    return {};
  }
}

/**
 * Update cart item quantity
 * @param {string} guestId - Guest user ID
 * @param {string} orderItemId - Order item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Response>} - API response
 */
export async function updateCartQuantity(guestId, orderItemId, quantity) {
  if (!API_URL || !guestId || !orderItemId) {
    throw new Error('Invalid parameters for quantity update');
  }

  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${API_URL}/api/cart/update`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderItemId, quantity }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update quantity');
    }

    return response;
  });
}

/**
 * Remove item from cart
 * @param {string} guestId - Guest user ID
 * @param {string} orderItemId - Order item ID to remove
 * @returns {Promise<Response>} - API response
 */
export async function removeCartItem(guestId, orderItemId) {
  if (!API_URL || !guestId || !orderItemId) {
    throw new Error('Invalid parameters for item removal');
  }

  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${API_URL}/api/cart/remove/${orderItemId}`,
      {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item');
    }

    return response;
  });
}

export async function bulkRemoveCartItems(guestId, orderItemIds) {
  if (!isApiConfigured() || !guestId || !orderItemIds?.length) {
    throw new Error('Invalid parameters for bulk item removal');
  }

  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/removebulk`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId
        },
        body: JSON.stringify({ orderItemIds })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove items');
    }

    return response.json();
  });
}


/**
 * Upload prescription file
 * @param {string} guestId - Guest user ID
 * @param {string} medicationId - Medication ID
 * @param {File} file - Prescription file
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} - Upload response data
 */
export async function uploadPrescription(guestId, medicationId, file, onProgress = null) {
  if (!API_URL || !guestId || !medicationId || !file) {
    throw new Error('Invalid parameters for prescription upload');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('medicationId', medicationId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', `${API_URL}/api/cart/prescription/upload`);
    xhr.setRequestHeader('x-guest-id', guestId);
    xhr.timeout = 30000; // 30 seconds for file upload
    xhr.send(formData);
  });
}

/**
 * Refresh cart and prescription statuses
 * @param {Function} fetchCartFn - Cart fetch function
 * @param {string} guestId - Guest user ID
 * @param {Array} medicationIds - Array of medication IDs (optional)
 * @returns {Promise<Object>} - Object containing cart and prescription statuses
 */
export async function refreshCartData(fetchCartFn, guestId, medicationIds = []) {
  const results = {
    cart: null,
    prescriptionStatuses: {},
    errors: []
  };

  try {
    // Fetch cart data
    await fetchCartData(fetchCartFn);
    results.cart = true;
  } catch (error) {
    results.errors.push({ type: 'cart', error });
  }

  try {
    // Fetch prescription statuses if medication IDs provided
    if (guestId && medicationIds.length > 0) {
      results.prescriptionStatuses = await loadPrescriptionStatuses(guestId, medicationIds);
    }
  } catch (error) {
    results.errors.push({ type: 'prescriptions', error });
  }

  return results;
}

/**
 * Get API URL
 * @returns {string} - The configured API URL
 */
export function getApiUrl() {
  return API_URL;
}

/**
 * Check if API is configured
 * @returns {boolean} - Whether API URL is configured
 */
export function isApiConfigured() {
  return !!API_URL;
}

// Export constants for use in components
export const API_CONSTANTS = {
  REQUEST_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
  POLLING_INTERVAL: 30000, // 30 seconds
};

// Export prescription statuses enum
export const PrescriptionStatuses = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};