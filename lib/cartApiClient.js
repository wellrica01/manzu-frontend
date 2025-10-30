import { apiRequest, sanitizeSearchParams, validateResponse, APIError } from './apiClient';

const API_CONFIG = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  POLLING_INTERVAL: 30000,
  UPLOAD_TIMEOUT: 30000,
};

// Prescription status enum
export const PrescriptionStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

/**
 * Validate quantity
 */
function validateQuantity(quantity) {
  const num = parseInt(quantity);
  
  if (isNaN(num)) {
    throw new APIError('Quantity must be a number', 400, 'VALIDATION_ERROR');
  }
  
  if (num < API_CONFIG.MIN_QUANTITY || num > API_CONFIG.MAX_QUANTITY) {
    throw new APIError(
      `Quantity must be between ${API_CONFIG.MIN_QUANTITY} and ${API_CONFIG.MAX_QUANTITY}`,
      400,
      'VALIDATION_ERROR'
    );
  }
  
  return num;
}


/**
 * Validate UUID (Guest ID)
 */
function validateUUID(uuid, fieldName = 'ID') {
  console.log('Validating UUID:', uuid); // 🔍 debug
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid || typeof uuid !== 'string' || !uuidRegex.test(uuid.trim())) {
    throw new APIError(`${fieldName} must be a valid UUID`, 400, 'VALIDATION_ERROR');
  }
  return uuid.trim();
}



/**
 * Validate item ID (expects a number)
 */
function validateItemId(itemId, fieldName = 'Item ID') {
  // Check if the value is missing or not a valid number
  if (itemId === undefined || itemId === null || isNaN(Number(itemId))) {
    throw new APIError(`${fieldName} must be a valid number`, 400, 'VALIDATION_ERROR');
  }

  const numericId = Number(itemId);

  // Ensure it's a positive integer (common requirement)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new APIError(`${fieldName} must be a positive integer`, 400, 'VALIDATION_ERROR');
  }

  return numericId;
}


/**
 * Fetch cart data with validation
 */
export async function fetchCart(guestId, apiUrl) {
  validateUUID(guestId, 'Guest ID');

  
  const requestKey = `cart-${guestId}`;
  const url = `${apiUrl}/api/cart`;
  
  try {
    const data = await apiRequest(requestKey, url, {
      headers: { 'x-guest-id': guestId },
    });
    
    return validateResponse(data, { pharmacies: true });
  } catch (error) {
    console.error('Fetch cart error:', error);
    throw new APIError('Failed to load cart', error.status, 'CART_FETCH_ERROR');
  }
}

/**
 * Update cart item quantity with validation
 */
export async function updateQuantity(guestId, orderItemId, quantity, apiUrl) {
  validateUUID(guestId, 'Guest ID');
  validateItemId(orderItemId, 'Order Item ID');
  const validQuantity = validateQuantity(quantity);
  
  const requestKey = `cart-update-${orderItemId}`;
  const url = `${apiUrl}/api/cart/update`;
  
  try {
    const data = await apiRequest(requestKey, url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId,
      },
      body: JSON.stringify({
        orderItemId,
        quantity: validQuantity,
      }),
    });
    
    return validateResponse(data, { success: true });
  } catch (error) {
    console.error('Update quantity error:', error);
    // Re-throw the original error to preserve error.response.data
    throw error;
  }
}

/**
 * Remove item from cart with validation
 */
export async function removeItem(guestId, orderItemId, apiUrl) {
  validateUUID(guestId, 'Guest ID');
  validateItemId(orderItemId, 'Order Item ID');
  
  const requestKey = `cart-remove-${orderItemId}`;
  const url = `${apiUrl}/api/cart/remove/${orderItemId}`;
  
  try {
    const data = await apiRequest(requestKey, url, {
      method: 'DELETE',
      headers: { 'x-guest-id': guestId },
    });
    
    return validateResponse(data, { success: true });
  } catch (error) {
    console.error('Remove item error:', error);
    throw new APIError('Failed to remove item', error.status, 'REMOVE_ITEM_ERROR');
  }
}

/**
 * Bulk remove items with validation
 */
export async function bulkRemoveItems(guestId, orderItemIds, apiUrl) {
  validateUUID(guestId, 'Guest ID');
  
  if (!Array.isArray(orderItemIds) || orderItemIds.length === 0) {
    throw new APIError('Order item IDs must be a non-empty array', 400, 'VALIDATION_ERROR');
  }
  
  // Validate each ID
  orderItemIds.forEach((id, index) => {
    try {
      validateItemId(id, `Order Item ID at index ${index}`);
    } catch (error) {
      throw new APIError(`Invalid ID at index ${index}`, 400, 'VALIDATION_ERROR');
    }
  });
  
  const requestKey = `cart-bulk-remove-${orderItemIds.join('-')}`;
  const url = `${apiUrl}/api/cart/remove-bulk`;
  
  try {
    const data = await apiRequest(requestKey, url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId,
      },
      body: JSON.stringify({ orderItemIds }),
    });
    
    return validateResponse(data, { success: true });
  } catch (error) {
    console.error('Bulk remove error:', error);
    throw new APIError('Failed to remove items', error.status, 'BULK_REMOVE_ERROR');
  }
}


/**
 * Load prescription statuses with validation
 */
export async function loadPrescriptionStatuses(guestId, medicationIds, apiUrl) {
  // Validate guest ID as UUID
  const validGuestId = validateUUID(guestId, 'Guest ID');
  
  // Validate medication IDs as positive integers
  if (!Array.isArray(medicationIds) || medicationIds.length === 0) {
    return {};
  }

  const validIds = medicationIds
    .map(id => {
      try {
        return validateItemId(id, 'Medication ID');
      } catch {
        return null; // skip invalid IDs
      }
    })
    .filter(id => id !== null);

  if (validIds.length === 0) {
    return {};
  }

  const requestKey = `prescription-status-${validIds.join('-')}`;
  const url = `${apiUrl}/api/cart/prescription/status?medicationIds=${validIds.join(',')}`;

  try {
    const data = await apiRequest(requestKey, url, {
      headers: { 'x-guest-id': validGuestId },
    });
    return data || {};
  } catch (error) {
    console.error('Load prescription statuses error:', error);
    // Don't throw - prescription statuses are optional
    return {};
  }
}

/**
 * Upload prescription with progress tracking and abort support
 */
export async function uploadPrescription(guestId, medicationId, file, apiUrl, onProgress, abortSignal) {
  validateUUID(guestId, 'Guest ID');
  validateItemId(medicationId, 'Medication ID');
  
  if (!file || !(file instanceof File)) {
    throw new APIError('Valid file is required', 400, 'VALIDATION_ERROR');
  }
  
  // Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new APIError('File size must be less than 10MB', 400, 'FILE_TOO_LARGE');
  }
  
  // Validate file type
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new APIError('File must be JPG, PNG, or PDF', 400, 'INVALID_FILE_TYPE');
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medicationId', medicationId);
    
    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort();
        reject(new APIError('Upload cancelled', 0, 'ABORTED'));
      });
    }
    
    // Track progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new APIError('Invalid response format', xhr.status, 'PARSE_ERROR'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new APIError(
            error.message || 'Upload failed',
            xhr.status,
            error.code || 'UPLOAD_ERROR'
          ));
        } catch {
          reject(new APIError(
            `Upload failed with status ${xhr.status}`,
            xhr.status,
            'UPLOAD_ERROR'
          ));
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new APIError('Network error during upload', 0, 'NETWORK_ERROR'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new APIError('Upload cancelled', 0, 'ABORTED'));
    });
    
    xhr.addEventListener('timeout', () => {
      reject(new APIError('Upload timed out', 0, 'TIMEOUT'));
    });
    
    xhr.open('POST', `${apiUrl}/api/cart/prescription/upload`);
    xhr.setRequestHeader('x-guest-id', guestId);
    xhr.timeout = API_CONFIG.UPLOAD_TIMEOUT;
    xhr.send(formData);
  });
}

export { API_CONFIG };