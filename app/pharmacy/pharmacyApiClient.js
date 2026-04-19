// lib/pharmacyApiClient.js
import { apiRequest, APIError, setAuthErrorHandler, isAuthError } from '../../lib/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Global auth error handler for pharmacy module
 * Clears token and redirects to login on 401/TOKEN_EXPIRED
 */
function handlePharmacyAuthError(error) {
  if (typeof window !== 'undefined') {
    // Clear the expired/invalid token
    localStorage.removeItem('pharmacyToken');
    
    // Store a message to show on the login page
    const message = error.code === 'TOKEN_EXPIRED' 
      ? 'Your session has expired. Please log in again.'
      : 'Authentication failed. Please log in again.';
    sessionStorage.setItem('authErrorMessage', message);
    
    // Redirect to login page
    window.location.href = '/pharmacy/login';
  }
}

// Register the global auth error handler
setAuthErrorHandler(handlePharmacyAuthError);

/**
 * Helper to wrap API calls with auth error handling
 * Automatically triggers logout/redirect on 401/TOKEN_EXPIRED
 */
async function withAuthHandling(promise) {
  try {
    return await promise;
  } catch (error) {
    if (isAuthError(error)) {
      handlePharmacyAuthError(error);
    }
    throw error;
  }
}

/**
 * Pharmacy Authentication APIs
 */
export const pharmacyAuthAPI = {
  /**
   * Register a new pharmacy
   * @param {Object} data - Registration data
   * @param {Object} data.pharmacy - Pharmacy details
   * @param {Object} data.user - User/Manager details
   * @returns {Promise<{token: string, pharmacy: Object, user: Object}>}
   */
  register: async (data) => {
    try {
      // Validate required fields
      if (!data?.pharmacy || !data?.user) {
        throw new APIError('Invalid registration data', 400, 'VALIDATION_ERROR');
      }

      // Sanitize inputs
      const sanitizedData = {
        pharmacy: {
          name: String(data.pharmacy.name || '').trim().slice(0, 200),
          address: String(data.pharmacy.address || '').trim().slice(0, 500),
          state: String(data.pharmacy.state || '').trim(),
          lga: String(data.pharmacy.lga || '').trim(),
          latitude: Number(data.pharmacy.latitude),
          longitude: Number(data.pharmacy.longitude),
          locationAccuracy: Number(data.pharmacy.locationAccuracy || 0),
          phone: String(data.pharmacy.phone || '').trim(),
          licenseNumber: String(data.pharmacy.licenseNumber || '').trim().slice(0, 50),
        },
        user: {
          name: String(data.user.name || '').trim().slice(0, 200),
          email: String(data.user.email || '').trim().toLowerCase().slice(0, 200),
          pin: String(data.user.pin || '').trim(),
        },
      };

      const response = await apiRequest(
        `pharmacy-register-${sanitizedData.user.email}`,
        `${API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedData),
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || 'Registration failed',
        500,
        'REGISTRATION_ERROR'
      );
    }
  },

  /**
   * Login to pharmacy account
   * @param {Object} credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.pin - 6-digit PIN
   * @returns {Promise<{token: string, pharmacy: Object, user: Object}>}
   */
  login: async (credentials) => {
    try {
      // Validate required fields
      if (!credentials?.email || !credentials?.pin) {
        throw new APIError('Email and PIN are required', 400, 'VALIDATION_ERROR');
      }

      // Sanitize inputs
      const sanitizedCredentials = {
        email: String(credentials.email).trim().toLowerCase().slice(0, 200),
        pin: String(credentials.pin).trim(),
      };

      // Validate PIN format
      if (!/^\d{6}$/.test(sanitizedCredentials.pin)) {
        throw new APIError('Invalid PIN format', 400, 'VALIDATION_ERROR');
      }

      const response = await apiRequest(
        `pharmacy-login-${sanitizedCredentials.email}`,
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedCredentials),
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || 'Login failed',
        500,
        'LOGIN_ERROR'
      );
    }
  },

  /**
   * Logout (client-side token cleanup)
   * Note: Actual token invalidation should happen server-side
   */
  logout: () => {
    // Remove token from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pharmacyToken');
      // If using cookies in the future:
      // document.cookie = 'pharmacyToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  },

  /**
   * Verify current token validity
   * @param {string} token - JWT token
   * @returns {Promise<{valid: boolean, user: Object, pharmacy: Object}>}
   */
  verifyToken: async (token) => {
    try {
      if (!token) {
        throw new APIError('No token provided', 401, 'UNAUTHORIZED');
      }

      const response = await apiRequest(
        `pharmacy-verify-${token.substring(0, 20)}`, // Use partial token for cache key
        `${API_BASE_URL}/api/auth/verify`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || 'Token verification failed',
        401,
        'TOKEN_VERIFICATION_ERROR'
      );
    }
  },
};

/**
 * Pharmacy Profile APIs
 */
export const pharmacyProfileAPI = {
  /**
   * Get pharmacy profile
   * @param {string} token - JWT token
   * @returns {Promise<Object>}
   */
  getProfile: async (token) => {
    return withAuthHandling((async () => {
      try {
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-profile-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/profile`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to fetch profile',
          500,
          'PROFILE_FETCH_ERROR'
        );
      }
    })());
  },

  /**
   * Update pharmacy profile
   * @param {string} token - JWT token
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>}
   */
  updateProfile: async (token, updates) => {
    return withAuthHandling((async () => {
      try {
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-update-${token.substring(0, 20)}-${Date.now()}`,
          `${API_BASE_URL}/api/pharmacy/profile`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to update profile',
          500,
          'PROFILE_UPDATE_ERROR'
        );
      }
    })());
  },
};

/**
 * Pharmacy Medications APIs
 */
export const pharmacyMedicationsAPI = {
  /**
   * Fetch medications with optional params
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  fetchMedications: async (params = {}) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const queryString = new URLSearchParams(params).toString();
        const cacheKey = `pharmacy-medications-${queryString || 'all'}-${token.substring(0, 20)}`;

        const response = await apiRequest(
          cacheKey,
          `${API_BASE_URL}/api/pharmacy/medications${queryString ? '?' + queryString : ''}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to fetch medications',
          500,
          'MEDICATIONS_FETCH_ERROR'
        );
      }
    })());
  },
};

/**
 * Pharmacy Sales APIs
 */
export const pharmacySalesAPI = {
  /**
   * Record a new sale
   * @param {Object} data - Sale data
   * @returns {Promise<Object>}
   */
  recordSale: async (data) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        // Validate data
        if (!data.items || !Array.isArray(data.items) || !data.total || !data.paymentMethod) {
          throw new APIError('Invalid sale data', 400, 'VALIDATION_ERROR');
        }

        const response = await apiRequest(
          `pharmacy-sale-record-${Date.now()}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/sales`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to record sale',
          500,
          'SALE_RECORD_ERROR'
        );
      }
    })());
  },

  /**
   * Fetch specific sale
   * @param {string|number} saleId - Sale ID
   * @returns {Promise<Object>}
   */
  fetchSpecificSale: async (saleId) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        if (!saleId) {
          throw new APIError('Sale ID required', 400, 'VALIDATION_ERROR');
        }

        const response = await apiRequest(
          `pharmacy-sale-${saleId}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/sales/${saleId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to fetch sale',
          500,
          'SALE_FETCH_ERROR'
        );
      }
    })());
  },
};




/**
 * Pharmacy Inventory APIs
 */
export const pharmacyInventoryAPI = {
  /**
   * Fetch inventory with optional filters
   * @param {Object} params - Query parameters (page, limit, search, lowStock, outOfStock, expiringSoon, prescriptionRequired)
   * @returns {Promise<{medications: Array, pagination: Object, summary: Object}>}
   */
  fetchInventory: async (params = {}) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const queryString = new URLSearchParams(params).toString();
        const cacheKey = `pharmacy-inventory-${queryString || 'all'}-${token.substring(0, 20)}`;

        const response = await apiRequest(
          cacheKey,
          `${API_BASE_URL}/api/pharmacy/medications${queryString ? '?' + queryString : ''}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to fetch inventory',
          500,
          'INVENTORY_FETCH_ERROR'
        );
      }
    })());
  },





  /**
 * Fetch medication catalog (NEW unified endpoint)
 * @param {Object} params - Query parameters (page, limit, search, status, prescriptionRequired)
 * @returns {Promise<Object>}
 */
fetchCatalog: async (params = {}) => {
  return withAuthHandling((async () => {
    try {
      const token = getPharmacyToken();
      if (!token) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const queryString = new URLSearchParams(params).toString();
      const cacheKey = `pharmacy-catalog-${queryString || 'all'}-${token.substring(0, 20)}`;

      const response = await apiRequest(
        cacheKey,
        `${API_BASE_URL}/api/pharmacy/medications/catalog${queryString ? '?' + queryString : ''}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || 'Failed to fetch catalog',
        500,
        'CATALOG_FETCH_ERROR'
      );
    }
  })());
},

/**
 * Update or create inventory item (unified upsert)
 * @param {number} medicationId
 * @param {Object} data - {stock, price, batchNumber, expiryDate}
 * @returns {Promise<Object>}
 */
updateOrCreateInventoryItem: async (medicationId, data) => {
  return withAuthHandling((async () => {
    try {
      const token = getPharmacyToken();
      if (!token) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const response = await apiRequest(
        `pharmacy-inventory-upsert-${medicationId}-${Date.now()}-${token.substring(0, 20)}`,
        `${API_BASE_URL}/api/pharmacy/medications/${medicationId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || 'Failed to update inventory',
        500,
        'INVENTORY_UPSERT_ERROR'
      );
    }
  })());
},





  /**
   * Create new inventory item
   * @param {Object} data - {medicationId, stock, price, batchNumber, expiryDate}
   * @returns {Promise<Object>}
   */
  createInventoryItem: async (data) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-inventory-create-${Date.now()}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/medications`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to create inventory item',
          500,
          'INVENTORY_CREATE_ERROR'
        );
      }
    })());
  },

  /**
   * Update inventory item
   * @param {number} medicationId
   * @param {Object} data - {stock, price, batchNumber, expiryDate}
   * @returns {Promise<Object>}
   */
  updateInventoryItem: async (medicationId, data) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-inventory-update-${medicationId}-${Date.now()}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/medications/${medicationId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to update inventory item',
          500,
          'INVENTORY_UPDATE_ERROR'
        );
      }
    })());
  },

  /**
   * Delete inventory item
   * @param {number} medicationId
   * @returns {Promise<Object>}
   */
  deleteInventoryItem: async (medicationId) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-inventory-delete-${medicationId}-${Date.now()}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/pharmacy/medications/${medicationId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response;
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to delete inventory item',
          500,
          'INVENTORY_DELETE_ERROR'
        );
      }
    })());
  },

  /**
   * Search medications for autocomplete
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  searchMedications: async (query) => {
    return withAuthHandling((async () => {
      try {
        const token = getPharmacyToken();
        if (!token) {
          throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const response = await apiRequest(
          `pharmacy-med-search-${query}-${token.substring(0, 20)}`,
          `${API_BASE_URL}/api/medication-suggestions?q=${encodeURIComponent(query)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const medications = Array.isArray(response) ? response : (response.suggestions || response.medications || []);
        
        return {
          data: {
            result: {
              medications: medications
            }
          }
        };
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError(
          error.message || 'Failed to search medications',
          500,
          'MEDICATION_SEARCH_ERROR'
        );
      }
    })());
  },
};



/**
 * Helper function to get token from storage
 * @returns {string|null}
 */
export const getPharmacyToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pharmacyToken');
};

/**
 * Helper function to set token in storage
 * @param {string} token
 */
export const setPharmacyToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('pharmacyToken', token);
  } else {
    localStorage.removeItem('pharmacyToken');
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getPharmacyToken();
};
