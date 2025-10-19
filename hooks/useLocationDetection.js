import { useState, useCallback, useRef } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

// 🎯 IMPROVED: More lenient configuration for better coverage
const SAMPLE_CONFIG = {
  QUICK_SAMPLES: 1,
  STANDARD_SAMPLES: 2,
  PRECISE_SAMPLES: 3,
  SAMPLE_INTERVAL: 1000,
  MIN_REQUIRED: 1,
  TIMEOUT_NETWORK: 8000,      // Network positioning timeout
  TIMEOUT_GPS: 15000,          // GPS timeout (more time for satellites)
  MAX_RETRIES: 2,
};

// 🎯 IMPROVED: Much more lenient accuracy tiers
const ACCURACY_CONFIG = {
  EXCELLENT: 50,    // 0-50m
  GOOD: 150,        // 50-150m
  ACCEPTABLE: 500,  // 150-500m
  USABLE: 2000,     // 500m-2km (still useful for city-level)
  MAX: 5000,        // Accept up to 5km in desperate situations
};

function isInNigeria(lat, lng) {
  return lat >= NIGERIA_BOUNDS.minLat && 
         lat <= NIGERIA_BOUNDS.maxLat && 
         lng >= NIGERIA_BOUNDS.minLng && 
         lng <= NIGERIA_BOUNDS.maxLng;
}

function getAccuracyQuality(accuracy) {
  if (accuracy < ACCURACY_CONFIG.EXCELLENT) return 'excellent';
  if (accuracy < ACCURACY_CONFIG.GOOD) return 'good';
  if (accuracy < ACCURACY_CONFIG.ACCEPTABLE) return 'acceptable';
  if (accuracy < ACCURACY_CONFIG.USABLE) return 'usable';
  return 'poor';
}

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function useLocationDetection() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [progress, setProgress] = useState(null);
  const [detectionMethod, setDetectionMethod] = useState(null); // 'network' or 'gps'
  
  const abortControllerRef = useRef(null);

  /**
   * 🎯 IMPROVED: Try network positioning first (fast), then GPS (accurate)
   */
  const getSingleReading = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const {
        enableHighAccuracy = false,
        timeout = enableHighAccuracy ? SAMPLE_CONFIG.TIMEOUT_GPS : SAMPLE_CONFIG.TIMEOUT_NETWORK,
        maximumAge = 0,
        ...rest
      } = options;

      const gpsOptions = {
        timeout,
        maximumAge,
        enableHighAccuracy,
        ...rest,
      };

      let settled = false;
      let timeoutId;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('GPS reading timeout'));
        }
      }, gpsOptions.timeout);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!settled) {
            settled = true;
            cleanup();
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              method: enableHighAccuracy ? 'gps' : 'network',
            });
          }
        },
        (err) => {
          if (!settled) {
            settled = true;
            cleanup();
            
            const error = new Error(
              err?.message || `Location error (code ${err?.code || 'unknown'})`
            );
            error.code = err?.code;
            error.originalError = err;
            reject(error);
          }
        },
        gpsOptions
      );
    });
  }, []);

  /**
   * 🎯 IMPROVED: Progressive location strategy with multiple fallbacks
   */
  const getLocationWithFallback = useCallback(async (onProgress) => {
    const attempts = [];
    let bestReading = null;

    // Strategy 1: Try network positioning (fast, ~100-500m accuracy)
    onProgress?.({
      status: 'trying_network',
      message: 'Getting approximate location...',
    });

    try {
      const networkReading = await getSingleReading({
        enableHighAccuracy: false,
        maximumAge: 10000, // Accept cached network position
        timeout: SAMPLE_CONFIG.TIMEOUT_NETWORK,
      });

      console.log('📡 Network reading:', networkReading);

      // Validate bounds
      if (isInNigeria(networkReading.latitude, networkReading.longitude)) {
        // Accept network reading if it's reasonable
        if (networkReading.accuracy <= ACCURACY_CONFIG.USABLE) {
          attempts.push(networkReading);
          bestReading = networkReading;
          setDetectionMethod('network');

          onProgress?.({
            status: 'network_success',
            message: 'Location found via network',
            accuracy: networkReading.accuracy,
            quality: getAccuracyQuality(networkReading.accuracy),
          });

          // If network accuracy is good enough, return early
          if (networkReading.accuracy <= ACCURACY_CONFIG.ACCEPTABLE) {
            return [networkReading];
          }
        }
      } else {
        console.warn('Network reading outside Nigeria bounds');
      }
    } catch (err) {
      console.warn('Network positioning failed:', err.message);
      onProgress?.({
        status: 'network_failed',
        message: 'Network positioning unavailable, trying GPS...',
      });
    }

    // Strategy 2: Try GPS positioning (slower, but more accurate)
    onProgress?.({
      status: 'trying_gps',
      message: 'Getting precise location via GPS...',
    });

    try {
      const gpsReading = await getSingleReading({
        enableHighAccuracy: true,
        maximumAge: 0, // Force fresh GPS reading
        timeout: SAMPLE_CONFIG.TIMEOUT_GPS,
      });

      console.log('🛰️ GPS reading:', gpsReading);

      // Validate bounds
      if (isInNigeria(gpsReading.latitude, gpsReading.longitude)) {
        // Accept GPS reading if it's within our max threshold
        if (gpsReading.accuracy <= ACCURACY_CONFIG.MAX) {
          attempts.push(gpsReading);
          setDetectionMethod('gps');

          // Use GPS if it's better than network reading
          if (!bestReading || gpsReading.accuracy < bestReading.accuracy) {
            bestReading = gpsReading;
          }

          onProgress?.({
            status: 'gps_success',
            message: 'GPS location acquired',
            accuracy: gpsReading.accuracy,
            quality: getAccuracyQuality(gpsReading.accuracy),
          });

          return attempts;
        }
      } else {
        console.warn('GPS reading outside Nigeria bounds');
      }
    } catch (err) {
      console.warn('GPS positioning failed:', err.message);
      onProgress?.({
        status: 'gps_failed',
        message: 'GPS unavailable',
      });
    }

    // Strategy 3: Last resort - accept any valid reading within Nigeria
    if (bestReading) {
      console.log('✅ Using best available reading:', bestReading);
      return [bestReading];
    }

    // All strategies failed
    throw new Error('Unable to determine your location. Please select manually.');
  }, [getSingleReading]);

  const calculateLocation = useCallback((samples) => {
    if (samples.length === 0) {
      throw new Error('No valid GPS readings obtained');
    }

    const latitudes = samples.map(s => s.latitude);
    const longitudes = samples.map(s => s.longitude);
    const accuracies = samples.map(s => s.accuracy);

    const finalLat = median(latitudes);
    const finalLng = median(longitudes);
    const finalAccuracy = median(accuracies);

    const quality = getAccuracyQuality(finalAccuracy);

    return {
      latitude: finalLat,
      longitude: finalLng,
      accuracy: Math.round(finalAccuracy),
      quality,
      sampleCount: samples.length,
      timestamp: Date.now(),
    };
  }, []);

  /**
   * 🎯 IMPROVED: Smart location detection with fallback strategies
   */
  const requestLocation = useCallback(async (options = {}) => {
    const { samples = SAMPLE_CONFIG.STANDARD_SAMPLES } = options;

    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress({ status: 'starting', message: 'Detecting your location...' });
      
      abortControllerRef.current = new AbortController();

      // Use progressive fallback strategy
      const rawSamples = await getLocationWithFallback(setProgress);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Location request cancelled');
      }

      if (rawSamples.length === 0) {
        throw new Error(
          'Unable to detect location. Please select your area manually.'
        );
      }

      const location = calculateLocation(rawSamples);

      // Final validation
      if (!isInNigeria(location.latitude, location.longitude)) {
        throw new Error(
          'Location detected outside Nigeria. Please select your area manually.'
        );
      }

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setProgress(null);
      
      return location;

    } catch (err) {
      if (err.message !== 'Location request cancelled') {
        console.error('Location error:', err);
      }

      let errorMessage = 'Unable to detect location';
      let errorDetails = null;
      
      if (err.message === 'Location request cancelled') {
        errorMessage = 'Location request cancelled';
      } else if (err.code === 1) {
        errorMessage = 'Location access denied';
        errorDetails = 'Please enable location access in your browser settings';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable';
        errorDetails = 'Your device cannot determine your location. This may be due to poor GPS signal or disabled location services.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out';
        errorDetails = 'Finding your location is taking too long. This often happens indoors or in areas with poor GPS signal.';
      } else if (err.message) {
        errorMessage = err.message;
        errorDetails = 'You can still use the app by selecting your location manually.';
      }

      const error = new Error(errorMessage);
      error.code = err.code;
      error.details = errorDetails;
      error.originalError = err;

      setLocationStatus(err.message === 'Location request cancelled' ? 'pending' : 'denied');
      setUserLocation(null);
      setAccuracy(null);
      setProgress(null);
      setError(error);
      
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [getLocationWithFallback, calculateLocation]);

  const requestQuickLocation = useCallback(async () => {
    return requestLocation({ samples: SAMPLE_CONFIG.QUICK_SAMPLES });
  }, [requestLocation]);

  const requestPreciseLocation = useCallback(async () => {
    return requestLocation({ samples: SAMPLE_CONFIG.PRECISE_SAMPLES });
  }, [requestLocation]);

  const cancelLocationRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLocationStatus('pending');
      setProgress(null);
      setError(null);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setAccuracy(null);
    setLocationStatus('pending');
    setError(null);
    setProgress(null);
    setDetectionMethod(null);
  }, []);

  return {
    userLocation,
    locationStatus,
    accuracy,
    error,
    progress,
    detectionMethod,
    
    requestLocation,
    requestPreciseLocation,
    requestQuickLocation,
    cancelLocationRequest,
    clearLocation,
  };
}

export { NIGERIA_BOUNDS, ACCURACY_CONFIG, SAMPLE_CONFIG };