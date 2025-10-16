import { useState, useCallback, useRef } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

// ⚡ OPTIMIZED: Faster configuration for better UX
const SAMPLE_CONFIG = {
  QUICK_SAMPLES: 1,      // ⚡ Single sample for initial detection
  STANDARD_SAMPLES: 2,    // ⚡ Reduced from 3 to 2
  PRECISE_SAMPLES: 3,     // ⚡ Reduced from 5 to 3
  SAMPLE_INTERVAL: 800,   // ⚡ Reduced from 1000ms to 800ms
  MIN_REQUIRED: 1,        // ⚡ Reduced from 2 to 1
  TIMEOUT: 8000,          // ⚡ Reduced from 10000ms to 8000ms
  MAX_RETRIES: 1,
};

// ⚡ OPTIMIZED: Relaxed accuracy for faster results
const ACCURACY_CONFIG = {
  EXCELLENT: 30,   // Relaxed from 20m
  GOOD: 80,        // Relaxed from 50m
  ACCEPTABLE: 150, // Relaxed from 100m
  MAX: 300,        // Relaxed from 200m - accept more readings
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
  
  const abortControllerRef = useRef(null);

  const getSingleReading = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // ⚡ OPTIMIZED: Use less strict options for faster initial reading
      const gpsOptions = {
        timeout: SAMPLE_CONFIG.TIMEOUT,
        maximumAge: 5000,  // ⚡ Allow cached readings up to 5 seconds old
        enableHighAccuracy: false, // ⚡ Start with low accuracy for speed
        ...options,
      };

      let settled = false;

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('GPS reading timeout'));
        }
      }, gpsOptions.timeout);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          }
        },
        (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            
            const error = err instanceof Error 
              ? err 
              : new Error(err?.message || `GPS error code ${err?.code || 'unknown'}`);
            
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
   * ⚡ OPTIMIZED: Collect samples with progressive enhancement
   * - Start with quick, low-accuracy reading
   * - Optionally get more samples in background for refinement
   */
  const collectSamples = useCallback(async (sampleCount, onProgress) => {
    const samples = [];
    let retryCount = 0;

    for (let i = 0; i < sampleCount; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Location request cancelled');
      }

      try {
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'collecting',
          samplesCollected: samples.length,
        });

        // ⚡ Use high accuracy only after first reading
        const reading = await getSingleReading({
          enableHighAccuracy: i > 0, // First reading is fast, others are accurate
        });

        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Location request cancelled');
        }

        // Validate Nigeria bounds
        if (!isInNigeria(reading.latitude, reading.longitude)) {
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          continue;
        }

        // ⚡ Accept wider accuracy range
        if (reading.accuracy > ACCURACY_CONFIG.MAX) {
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          continue;
        }

        samples.push(reading);
        retryCount = 0;
        
        const quality = getAccuracyQuality(reading.accuracy);
        
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'success',
          accuracy: reading.accuracy,
          quality,
          samplesCollected: samples.length,
        });

        // ⚡ Shorter wait between samples
        if (i < sampleCount - 1) {
          await new Promise(resolve => setTimeout(resolve, SAMPLE_CONFIG.SAMPLE_INTERVAL));
        }

      } catch (err) {
        if (err.message === 'Location request cancelled') {
          throw err;
        }

        if (err.code === 1) {
          throw new Error('Location permission denied. Please enable location access.');
        }

        // ⚡ Be more lenient with errors - continue if we have at least 1 sample
        if (samples.length >= SAMPLE_CONFIG.MIN_REQUIRED) {
          console.warn(`Sample ${i + 1} failed but continuing with ${samples.length} samples`);
          break;
        }

        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'error',
          error: err.message,
          samplesCollected: samples.length,
        });
      }
    }

    return samples;
  }, [getSingleReading]);

  const calculateLocation = useCallback((samples) => {
    if (samples.length === 0) {
      throw new Error('No valid GPS readings obtained');
    }

    // ⚡ Accept even single sample
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
   * ⚡ OPTIMIZED: Quick location with progressive enhancement
   */
  const requestLocation = useCallback(async (options = {}) => {
    const { samples = SAMPLE_CONFIG.STANDARD_SAMPLES } = options;

    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 0, total: samples, status: 'starting' });
      
      abortControllerRef.current = new AbortController();

      const rawSamples = await collectSamples(samples, setProgress);

      if (rawSamples.length === 0) {
        throw new Error(
          'Unable to detect location. Please select your area manually.'
        );
      }

      const location = calculateLocation(rawSamples);

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
      
      if (err.message === 'Location request cancelled') {
        errorMessage = 'Location request cancelled';
      } else if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location in your browser.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please try again or select manually.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      const error = new Error(errorMessage);
      error.code = err.code;
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
  }, [collectSamples, calculateLocation]);

  const requestPreciseLocation = useCallback(async () => {
    return requestLocation({ samples: SAMPLE_CONFIG.PRECISE_SAMPLES });
  }, [requestLocation]);

  /**
   * ⚡ OPTIMIZED: Ultra-fast single reading
   */
  const requestQuickLocation = useCallback(async () => {
    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 1, total: 1, status: 'collecting' });

      // ⚡ Single reading with relaxed accuracy
      const reading = await getSingleReading({
        enableHighAccuracy: false,
        maximumAge: 10000, // Accept cached readings up to 10 seconds
      });

      if (!isInNigeria(reading.latitude, reading.longitude)) {
        throw new Error(
          'Location detected outside Nigeria. Please select your area manually.'
        );
      }

      const quality = getAccuracyQuality(reading.accuracy);
      const location = {
        latitude: reading.latitude,
        longitude: reading.longitude,
        accuracy: Math.round(reading.accuracy),
        quality,
        sampleCount: 1,
        timestamp: reading.timestamp,
      };

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setProgress(null);
      
      return location;

    } catch (err) {
      console.error('Quick location error:', err);
      
      let errorMessage = 'Unable to detect location';
      
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location in your browser.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please try again or select manually.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      const error = new Error(errorMessage);
      error.code = err.code;
      error.originalError = err;

      setLocationStatus('denied');
      setUserLocation(null);
      setAccuracy(null);
      setProgress(null);
      setError(error);
      
      throw error;
    }
  }, [getSingleReading]);

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
  }, []);

  return {
    userLocation,
    locationStatus,
    accuracy,
    error,
    progress,
    
    requestLocation,
    requestPreciseLocation,
    requestQuickLocation,
    cancelLocationRequest,
    clearLocation,
  };
}

export { NIGERIA_BOUNDS, ACCURACY_CONFIG, SAMPLE_CONFIG };