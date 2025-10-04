// Action constants
export const ACTIONS = {
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_RESULTS: 'SET_RESULTS',
  SET_DEFAULT_RESULTS: 'SET_DEFAULT_RESULTS',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  SET_ERROR: 'SET_ERROR',
  SET_CART_ITEMS: 'SET_CART_ITEMS',
  SET_SHOW_DROPDOWN: 'SET_SHOW_DROPDOWN',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_LOADING_SUGGESTIONS: 'SET_LOADING_SUGGESTIONS',
  SET_ADDING_TO_CART: 'SET_ADDING_TO_CART',
  SET_FOCUSED_INDEX: 'SET_FOCUSED_INDEX',
  SET_OPEN_CART_DIALOG: 'SET_OPEN_CART_DIALOG',
  SET_LAST_ADDED_ITEMS: 'SET_LAST_ADDED_ITEMS',
  SET_FILTERS: 'SET_FILTERS',
  SET_SORT_BY: 'SET_SORT_BY',
  SET_STATES: 'SET_STATES',
  SET_LGAS: 'SET_LGAS',
  SET_WARDS: 'SET_WARDS',
  SET_GEO_DATA: 'SET_GEO_DATA',
  SET_SHOW_FILTERS: 'SET_SHOW_FILTERS',
  SET_IS_SEARCHING: 'SET_IS_SEARCHING',
  SET_SEARCH_HISTORY: 'SET_SEARCH_HISTORY',
  SET_SHOW_HISTORY: 'SET_SHOW_HISTORY',
  SET_DUPLICATE_DIALOG: 'SET_DUPLICATE_DIALOG',
  SET_PENDING_ADD: 'SET_PENDING_ADD', 
};

// Configuration
const CONFIG = {
  SEARCH_RADIUS_KM: 10,
  DEBOUNCE_DELAY_MS: 300,
  MAX_SEARCH_HISTORY: 10,
  HISTORY_STORAGE_KEY: 'searchHistory',
  HISTORY_SAVE_DEBOUNCE_MS: 1000,
};

// API functions with abort signal support
export const fetchGeoData = async (signal) => {
  const res = await fetch('/data/full.json', { signal });
  if (!res.ok) throw new Error('Failed to load geo data');
  return res.json();
};

export const fetchSuggestions = async (query, t, apiUrl, signal) => {
  if (!query) return [];
  const res = await fetch(
    `${apiUrl}/api/medication-suggestions?q=${encodeURIComponent(query)}`,
    { signal }
  );
  if (!res.ok) throw new Error(t('errors.suggestions_failed'));
  return res.json();
};

export const searchMedications = async (
  { medicationId, filters, sortBy, userLocation, ignoreFilters }, 
  t,
  apiUrl,
  signal
) => {
  const params = new URLSearchParams({ 
    medicationId, 
    sortBy 
  });
  
  if (userLocation) {
    params.append('lat', userLocation.lat);
    params.append('lng', userLocation.lng);
    params.append('radius', CONFIG.SEARCH_RADIUS_KM.toString());
  }
  
  if (!ignoreFilters) {
    if (filters.state) params.append('state', filters.state);
    if (filters.lga) params.append('lga', filters.lga);
    if (filters.ward) params.append('ward', filters.ward);
  }

  const res = await fetch(`${apiUrl}/api/search?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(t('errors.search_failed'));
  return res.json();
};

export const addToCart = async (
  { medicationId, pharmacyId, quantity, guestId },
  t,
  apiUrl,
  signal
) => {
  const res = await fetch(`${apiUrl}/api/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
    body: JSON.stringify({ medicationId, pharmacyId, quantity }),
    signal,
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || t('errors.add_to_cart_failed'));
  }
  const result = await res.json();
  return result;
};
 

// Geolocation utilities
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
};

export const reverseGeocode = (userLat, userLng, geoData) => {
  let nearest = null;
  let minDistance = Infinity;

  geoData.forEach((state) => {
    state.lgas.forEach((lga) => {
      // Approximate LGA centroid from ward coordinates
      const lgaCoords = lga.wards.map((w) => [w.latitude, w.longitude]);
      const avgLat =
        lgaCoords.reduce((sum, [lat]) => sum + lat, 0) / lgaCoords.length;
      const avgLng =
        lgaCoords.reduce((sum, [, lng]) => sum + lng, 0) / lgaCoords.length;

      const dist = haversineDistance(userLat, userLng, avgLat, avgLng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          state: state.state,
          lga: lga.name,
          distance: dist,
        };
      }
    });
  });

  return nearest;
};

// Local storage utilities with error handling
export const loadSearchHistory = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

export const saveSearchHistory = (history) => {
  if (typeof window === 'undefined') return;
  
  try {
    const trimmedHistory = history.slice(0, CONFIG.MAX_SEARCH_HISTORY);
    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

export const clearSearchHistory = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};

export { CONFIG };