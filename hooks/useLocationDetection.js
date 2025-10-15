import { useState, useEffect, useCallback, useRef } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

// Accuracy thresholds
const ACCURACY_CONFIG = {
  EXCELLENT: 20,
  GOOD: 50,
  ACCEPTABLE: 100,
  MAX: 200,
};

// Sample configuration
const SAMPLE_CONFIG = {
  STANDARD_SAMPLES: 3,
  PRECISE_SAMPLES: 5,
  SAMPLE_INTERVAL: 1000,
  MIN_REQUIRED: 2,
  TIMEOUT: 10000,
  MAX_RETRIES: 1, // ✅ NEW: Retry failed samples once
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

function standardDeviation(values, mean) {
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function filterOutliers(samples) {
  if (samples.length < 3) return samples;

  const centerLat = samples.reduce((sum, s) => sum + s.latitude, 0) / samples.length;
  const centerLng = samples.reduce((sum, s) => sum + s.longitude, 0) / samples.length;

  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, centerLat, centerLng)
  );

  const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const stdDev = standardDeviation(distances, meanDist);
  const threshold = meanDist + (2 * stdDev);

  const filtered = samples.filter((_, i) => distances[i] <= threshold);

  if (filtered.length > 0 && filtered.length < samples.length) {
    console.log(`🧹 Filtered ${samples.length - filtered.length} outliers`);
  }
  
  return filtered.length >= SAMPLE_CONFIG.MIN_REQUIRED ? filtered : samples;
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

      const gpsOptions = {
        timeout: SAMPLE_CONFIG.TIMEOUT,
        maximumAge: 0,
        enableHighAccuracy: true,
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
   * ✅ ENHANCED: Collect samples with retry logic and better error feedback
   */
  const collectSamples = useCallback(async (sampleCount, onProgress) => {
    const samples = [];
    let retryCount = 0;
    let consecutiveFailures = 0; // ✅ Track consecutive failures

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

        const reading = await getSingleReading();

        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Location request cancelled');
        }

        // Validate Nigeria bounds
        if (!isInNigeria(reading.latitude, reading.longitude)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Sample ${i + 1}: Outside Nigeria`);
          }
          
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'outside_bounds',
            samplesCollected: samples.length,
          });
          
          consecutiveFailures++;
          
          // ✅ Retry once if we have retries left
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--; // Retry this sample
            await new Promise(resolve => setTimeout(resolve, 500)); // Short delay
            continue;
          }
          
          continue;
        }

        // Validate accuracy
        if (reading.accuracy > ACCURACY_CONFIG.MAX) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Sample ${i + 1}: Poor accuracy (${reading.accuracy}m)`);
          }
          
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'poor_accuracy',
            accuracy: reading.accuracy,
            samplesCollected: samples.length,
          });
          
          consecutiveFailures++;
          
          // ✅ Retry once if we have retries left
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--; // Retry this sample
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          continue;
        }

        // ✅ Success - reset counters
        samples.push(reading);
        consecutiveFailures = 0;
        retryCount = 0; // Reset retry count on success
        
        const quality = getAccuracyQuality(reading.accuracy);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📍 Sample ${i + 1}/${sampleCount}: ${reading.accuracy.toFixed(1)}m (${quality})`);
        }
        
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'success',
          accuracy: reading.accuracy,
          quality,
          samplesCollected: samples.length,
        });

        // Wait before next sample (except last one)
        if (i < sampleCount - 1) {
          await new Promise(resolve => setTimeout(resolve, SAMPLE_CONFIG.SAMPLE_INTERVAL));
        }

      } catch (err) {
        // Re-throw cancellation errors
        if (err.message === 'Location request cancelled') {
          throw err;
        }

        consecutiveFailures++;
        
        // ✅ Better error classification
        let errorType = 'error';
        let errorMessage = err?.message || 'GPS reading failed';
        
        if (err.message === 'GPS reading timeout' || err.code === 3) {
          errorType = 'timeout';
          errorMessage = 'GPS signal timeout';
        } else if (err.code === 1) {
          errorType = 'permission_denied';
          errorMessage = 'Location permission denied';
          // ✅ Permission denied is fatal - stop immediately
          throw new Error('Location permission denied. Please enable location access.');
        } else if (err.code === 2) {
          errorType = 'unavailable';
          errorMessage = 'GPS unavailable';
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Sample ${i + 1} failed:`, errorMessage);
        }
        
        // ✅ Send detailed error to UI
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: errorType,
          error: errorMessage,
          errorType,
          samplesCollected: samples.length,
          consecutiveFailures, // ✅ Let UI know about consecutive failures
        });

        // ✅ Retry logic
        if (retryCount < SAMPLE_CONFIG.MAX_RETRIES && errorType === 'timeout') {
          retryCount++;
          i--; // Retry this sample
          
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'retrying',
            error: `Retrying (${retryCount}/${SAMPLE_CONFIG.MAX_RETRIES})...`,
            samplesCollected: samples.length,
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          continue;
        }

        // ✅ If too many consecutive failures, stop early
        if (consecutiveFailures >= 3) {
          throw new Error(
            `GPS signal too weak. ${samples.length} sample${samples.length !== 1 ? 's' : ''} collected. Please move outdoors or select location manually.`
          );
        }

        retryCount = 0; // Reset retry count after a failed attempt
      }
    }

    return samples;
  }, [getSingleReading]);

  const calculateLocation = useCallback((samples) => {
    if (samples.length === 0) {
      throw new Error('No valid GPS readings obtained');
    }

    if (samples.length < SAMPLE_CONFIG.MIN_REQUIRED) {
      throw new Error(
        `Insufficient valid readings. Got ${samples.length}, need ${SAMPLE_CONFIG.MIN_REQUIRED}`
      );
    }

    const latitudes = samples.map(s => s.latitude);
    const longitudes = samples.map(s => s.longitude);
    const accuracies = samples.map(s => s.accuracy);

    const finalLat = median(latitudes);
    const finalLng = median(longitudes);
    const finalAccuracy = median(accuracies);

    const distances = samples.map(s => 
      haversineDistance(s.latitude, s.longitude, finalLat, finalLng)
    );
    const consistency = Math.max(...distances);

    const quality = getAccuracyQuality(finalAccuracy);

    return {
      latitude: finalLat,
      longitude: finalLng,
      accuracy: Math.round(finalAccuracy),
      quality,
      sampleCount: samples.length,
      consistency: Math.round(consistency),
      timestamp: Date.now(),
    };
  }, []);

  const requestLocation = useCallback(async (options = {}) => {
    const { samples = SAMPLE_CONFIG.STANDARD_SAMPLES } = options;

    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 0, total: samples, status: 'starting' });
      
      abortControllerRef.current = new AbortController();

      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 Collecting ${samples} GPS samples...`);
      }

      const rawSamples = await collectSamples(samples, setProgress);

      if (rawSamples.length === 0) {
        throw new Error(
          'No valid GPS readings obtained. Please enable GPS and ensure you have a clear view of the sky.'
        );
      }

      const filtered = filterOutliers(rawSamples);
      const location = calculateLocation(filtered);

      if (!isInNigeria(location.latitude, location.longitude)) {
        throw new Error(
          'Your location is outside Nigeria. Please use the State/LGA filter to search.'
        );
      }

      // ✅ Add info about partial success
      const samplesRequested = samples;
      const samplesCollected = location.sampleCount;
      
      if (samplesCollected < samplesRequested) {
        location.partialSuccess = true;
        location.samplesRequested = samplesRequested;
      }

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setProgress(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Location detected:', location);
      }
      
      return location;

    } catch (err) {
      if (err.message !== 'Location request cancelled') {
        console.error('Location error:', err);
      }

      let errorMessage = 'Failed to get location';
      
      if (err.message === 'Location request cancelled') {
        errorMessage = 'Location request cancelled';
      } else if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please enable GPS and try outdoors.';
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

  const requestQuickLocation = useCallback(async () => {
    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress(null);

      const reading = await getSingleReading();

      if (!isInNigeria(reading.latitude, reading.longitude)) {
        throw new Error(
          'Your location is outside Nigeria. Please use the State/LGA filter to search.'
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

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ Quick location detected:', location);
      }
      
      return location;

    } catch (err) {
      console.error('Quick location error:', err);
      
      let errorMessage = 'Failed to get location';
      
      if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please enable GPS and try outdoors.';
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Location request cancelled');
      }
    }
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setAccuracy(null);
    setLocationStatus('pending');
    setError(null);
    setProgress(null);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍🔍 Location state:', {
        userLocation,
        locationStatus,
        accuracy: accuracy ? `${accuracy}m` : null,
        hasError: !!error,
        progress,
      });
    }
  }, [userLocation, locationStatus, accuracy, error, progress]);

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