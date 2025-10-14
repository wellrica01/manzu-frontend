import { useState, useEffect, useCallback } from 'react';

// Reuse the same Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

function isInNigeria(lat, lng) {
  return lat >= NIGERIA_BOUNDS.minLat && 
         lat <= NIGERIA_BOUNDS.maxLat && 
         lng >= NIGERIA_BOUNDS.minLng && 
         lng <= NIGERIA_BOUNDS.maxLng;
}

/**
 * Hook for detecting user's geolocation (SEARCH functionality)
 * This uses a single reading for quick location detection

 * Features:
 * - Permission state tracking
 * - Automatic detection on mount
 * - Manual re-request capability
 * - Error handling
 * - Nigeria bounds validation
 */

export function useLocationDetection() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus('denied');
        const err = new Error('Geolocation not supported');
        setError(err);
        reject(err);
        return;
      }

      const options = {
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
        enableHighAccuracy: true,
      };

      setLocationStatus('requesting');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Validate Nigeria bounds for search
          if (!isInNigeria(lat, lng)) {
            const err = new Error(
              'Your location is outside Nigeria. Please use the State/LGA filter to search.'
            );
            setLocationStatus('denied');
            setUserLocation(null);
            setError(err);
            reject(err);
            return;
          }

          const location = { lat, lng };
          setUserLocation(location);
          setLocationStatus('granted');
          setError(null);
          
          console.log('âœ… Location detected:', location);
          resolve(location);
        },
        (err) => {
          console.error('Location error:', err);
          
          let errorMessage = 'Failed to get location';
          if (err.code === 1) {
            errorMessage = 'Location permission denied';
          } else if (err.code === 2) {
            errorMessage = 'Location unavailable';
          } else if (err.code === 3) {
            errorMessage = 'Location request timed out';
          }
          
          const error = new Error(errorMessage);
          error.code = err.code;
          
          setLocationStatus('denied');
          setUserLocation(null);
          setError(error);
          reject(error);
        },
        options
      );
    });
  }, []);

  // Debug logger
  useEffect(() => {
    console.log('ðŸ—ºï¸ Location state:', {
      userLocation,
      locationStatus,
      hasError: !!error,
    });
  }, [userLocation, locationStatus, error]);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setLocationStatus('prompt');
    setError(null);
  }, []);

  return {
    userLocation,
    locationStatus,
    error,
    requestLocation,
    clearLocation,
  };
}