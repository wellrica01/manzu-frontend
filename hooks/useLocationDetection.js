import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for detecting user's geolocation
 * Features:
 * - Permission state tracking
 * - Automatic detection on mount
 * - Manual re-request capability
 * - Error handling
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

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationStatus('granted');
          setError(null);
          resolve(location);
        },
        (err) => {
          setLocationStatus('denied');
          setUserLocation(null);
          setError(err);
          reject(err);
        },
        options
      );
    });
  }, []);

  useEffect(() => {
  console.log('userLocation updated:', userLocation);
}, [userLocation]);


  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setLocationStatus('prompt');
  }, []);


  return {
    userLocation,
    locationStatus,
    error,
    requestLocation,
    clearLocation,
  };
}