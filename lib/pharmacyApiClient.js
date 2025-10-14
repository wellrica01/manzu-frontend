// lib/pharmacyApiClient.js
import { apiRequest, APIError } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
  },

  /**
   * Update pharmacy profile
   * @param {string} token - JWT token
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>}
   */
  updateProfile: async (token, updates) => {
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

