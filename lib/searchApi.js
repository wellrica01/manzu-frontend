import { apiRequest, sanitizeSearchParams, validateResponse, APIError } from './apiClient';

const CONFIG = {
  SEARCH_RADIUS_KM: 10,
  MAX_SEARCH_HISTORY: 10,
  HISTORY_STORAGE_KEY: 'searchHistory',
};

/**
 * Fetch medication suggestions with validation
 */
export async function fetchSuggestions(query, apiUrl) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const cleanQuery = query.trim().slice(0, 100); // Max length
  if (cleanQuery.length < 2) {
    return [];
  }

  const requestKey = `suggestions-${cleanQuery}`;
  const url = `${apiUrl}/api/medication-suggestions?q=${encodeURIComponent(cleanQuery)}`;

  try {
    const data = await apiRequest(requestKey, url);
    return validateResponse(data, { suggestions: true });
  } catch (error) {
    console.error('Fetch suggestions error:', error);
    throw new APIError('Failed to fetch suggestions', error.status, 'SUGGESTIONS_ERROR');
  }
}

/**
 * Search medications with comprehensive validation
 */
export async function searchMedications(params, apiUrl) {
  // 🧩 1. Validate input
  if (!params.medicationId || typeof params.medicationId !== 'number') {
    throw new APIError('Invalid medication ID', 400, 'VALIDATION_ERROR');
  }

  // 🧭 2. Build and sanitize query
  const queryParams = {
    medicationId: String(params.medicationId),
    sortBy: params.sortBy || 'cheapest',
  };

  if (params.userLocation?.lat && params.userLocation?.lng) {
    const lat = parseFloat(params.userLocation.lat);
    const lng = parseFloat(params.userLocation.lng);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    ) {
      queryParams.lat = lat.toString();
      queryParams.lng = lng.toString();
      queryParams.radius = CONFIG.SEARCH_RADIUS_KM.toString();
    }
  }

  if (!params.ignoreFilters && params.filters) {
    if (params.filters.state) queryParams.state = params.filters.state;
    if (params.filters.lga) queryParams.lga = params.filters.lga;
    if (params.filters.ward) queryParams.ward = params.filters.ward;
  }

  const sanitized = sanitizeSearchParams(queryParams);
  const queryString = new URLSearchParams(sanitized).toString();
  const url = `${apiUrl}/api/search?${queryString}`;
  const requestKey = `search-${queryString}`;

  try {
    // ⚙️ 3. Perform request (cached or debounced inside apiRequest)
    const data = await apiRequest(requestKey, url);

    // ✅ 4. Validate and normalize the API response
    const results = validateResponse(data, { results: true });

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('Search returned empty results:', results);
    }

    console.log('🧪 searchMedications returning:', results);


    return results; // Always return a clean array

    
  } catch (error) {
    console.error('Search medications error:', error);
    throw new APIError(
      error.message || 'Failed to search medications',
      error.status || 500,
      'SEARCH_ERROR'
    );
  }
}

/**
 * Add item to cart with validation
 */
export async function addToCart(params, apiUrl, guestId) {
  // Validate params
    if (
    !params.medicationId ||
    (typeof params.medicationId !== 'string' && typeof params.medicationId !== 'number')
    ) {
    throw new APIError('Invalid medication ID', 400, 'VALIDATION_ERROR');
    }

    if (
    !params.pharmacyId ||
    (typeof params.pharmacyId !== 'string' && typeof params.pharmacyId !== 'number')
    ) {
    throw new APIError('Invalid pharmacy ID', 400, 'VALIDATION_ERROR');
    }

  
  const quantity = parseInt(params.quantity);
  if (isNaN(quantity) || quantity < 1 || quantity > 100) {
    throw new APIError('Invalid quantity', 400, 'VALIDATION_ERROR');
  }

  const requestKey = `cart-add-${params.medicationId}-${params.pharmacyId}-${Date.now()}`;
  const url = `${apiUrl}/api/cart/add`;

  try {
    const data = await apiRequest(requestKey, url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId || '',
      },
      body: JSON.stringify({
        medicationId: String(params.medicationId),
        pharmacyId: String(params.pharmacyId),
        quantity,
      }),
    });

    return validateResponse(data, { orderItem: true });
  } catch (error) {
    console.error('Add to cart error:', error);
    throw new APIError('Failed to add to cart', error.status, 'CART_ERROR');
  }
}

/**
 * Geolocation utilities with validation
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function reverseGeocode(userLat, userLng, geoData) {
  if (!geoData?.length || typeof userLat !== 'number' || typeof userLng !== 'number') {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const state of geoData) {
    if (!state?.lgas) continue;
    
    for (const lga of state.lgas) {
      if (!lga?.wards) continue;
      
      const lgaCoords = lga.wards
        .map((w) => [w.latitude, w.longitude])
        .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');
      
      if (lgaCoords.length === 0) continue;

      const avgLat = lgaCoords.reduce((sum, [lat]) => sum + lat, 0) / lgaCoords.length;
      const avgLng = lgaCoords.reduce((sum, [, lng]) => sum + lng, 0) / lgaCoords.length;
      const dist = haversineDistance(userLat, userLng, avgLat, avgLng);

      if (dist < minDistance) {
        minDistance = dist;
        nearest = { state: state.state, lga: lga.name, distance: dist };
      }
    }
  }

  return nearest;
}

/**
 * Search history management with error recovery
 */
export function loadSearchHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const history = localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY);
    if (!history) return [];
    
    const parsed = JSON.parse(history);
    
    // Validate structure
    if (!Array.isArray(parsed)) return [];
    
    return parsed
      .filter(item => item && (typeof item.id === 'number' || typeof item.id === 'string') && typeof item.displayName === 'string')
      .map(item => ({ ...item, id: Number(item.id) }))
      .slice(0, CONFIG.MAX_SEARCH_HISTORY);
  } catch (error) {
    console.error('Failed to load search history:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    } catch (e) {
      // Silent fail
    }
    return [];
  }
}

export function saveSearchHistory(history) {
  if (typeof window === 'undefined') return false;

  try {
    if (!Array.isArray(history)) {
      throw new Error('History must be an array');
    }

    const trimmed = history
      .filter(item => item && (typeof item.id === 'number' || typeof item.id === 'string') && typeof item.displayName === 'string')
      .map(item => ({ ...item, id: String(item.id) }))
      .slice(0, CONFIG.MAX_SEARCH_HISTORY);

    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (error) {
    console.error('Failed to save search history:', error);
    
    // If quota exceeded, try clearing old data
    if (error.name === 'QuotaExceededError') {
      try {
        const reduced = history.slice(0, Math.floor(CONFIG.MAX_SEARCH_HISTORY / 2));
        localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(reduced));
        return true;
      } catch (e) {
        // Final fallback - clear history
        try {
          localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
        } catch (cleanupError) {
          // Silent fail
        }
      }
    }
    
    return false;
  }
}

export function clearSearchHistory() {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear search history:', error);
    return false;
  }
}

export { CONFIG };