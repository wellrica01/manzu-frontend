import { useState, useEffect, useCallback } from 'react';

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
  STANDARD_SAMPLES: 3,      // Default for searches (good balance)
  PRECISE_SAMPLES: 5,       // For "Nearest" or critical searches
  SAMPLE_INTERVAL: 1000,    // 1 second between samples
  MIN_REQUIRED: 2,          // Minimum valid samples needed
  TIMEOUT: 10000,           // Per-sample timeout
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

/**
 * Calculate median (better than average for outliers)
 */
function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values, mean) {
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
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

/**
 * Filter outliers using statistical methods
 */
function filterOutliers(samples) {
  if (samples.length < 3) return samples;

  const centerLat = samples.reduce((sum, s) => sum + s.lat, 0) / samples.length;
  const centerLng = samples.reduce((sum, s) => sum + s.lng, 0) / samples.length;

  const distances = samples.map(s => 
    haversineDistance(s.lat, s.lng, centerLat, centerLng)
  );

  const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const stdDev = standardDeviation(distances, meanDist);
  const threshold = meanDist + (2 * stdDev);

  const filtered = samples.filter((_, i) => distances[i] <= threshold);

  if (filtered.length > 0) {
    console.log(`🧹 Filtered ${samples.length - filtered.length} outliers`);
  }
  
  return filtered.length >= SAMPLE_CONFIG.MIN_REQUIRED ? filtered : samples;
}

/**
 * Enhanced hook for detecting user's geolocation
 * Now uses multi-sampling by default for better indoor accuracy
 */
export function useLocationDetection() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [progress, setProgress] = useState(null); // Track sampling progress

  /**
   * Get single GPS reading
   */
  const getSingleReading = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const gpsOptions = {
        timeout: SAMPLE_CONFIG.TIMEOUT,
        maximumAge: 0, // Always fresh reading
        enableHighAccuracy: true,
        ...options,
      };

      let settled = false; // ✅ Prevent double resolution

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
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          }
        },
        (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            // ✅ Ensure error always has a message
            const error = new Error(
              err?.message || 
              (err?.code ? `GPS error code ${err.code}` : 'GPS reading failed')
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
   * Collect multiple GPS samples with progress tracking
   */
  const collectSamples = useCallback(async (sampleCount, onProgress) => {
    const samples = [];

    for (let i = 0; i < sampleCount; i++) {
      try {
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'collecting',
        });

        const reading = await getSingleReading();

        // Validate Nigeria bounds
        if (!isInNigeria(reading.lat, reading.lng)) {
          console.warn(`Sample ${i + 1}: Outside Nigeria`);
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'outside_bounds',
          });
          continue;
        }

        // Validate accuracy
        if (reading.accuracy > ACCURACY_CONFIG.MAX) {
          console.warn(`Sample ${i + 1}: Poor accuracy (${reading.accuracy}m)`);
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'poor_accuracy',
            accuracy: reading.accuracy,
          });
          continue;
        }

        samples.push(reading);
        const quality = getAccuracyQuality(reading.accuracy);
        
        console.log(`📍 Sample ${i + 1}/${sampleCount}: ${reading.accuracy.toFixed(1)}m (${quality})`);
        
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
        console.error(`Sample ${i + 1} failed:`, err?.message || err || 'Unknown error');
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'error',
          error: err?.message || 'GPS reading failed',
        });
      }
    }

    return samples;
  }, [getSingleReading]);

  /**
   * Calculate final location from samples
   */
  const calculateLocation = useCallback((samples) => {
    if (samples.length === 0) {
      throw new Error('No valid GPS readings obtained');
    }

    if (samples.length < SAMPLE_CONFIG.MIN_REQUIRED) {
      throw new Error(
        `Insufficient valid readings. Got ${samples.length}, need ${SAMPLE_CONFIG.MIN_REQUIRED}`
      );
    }

    const latitudes = samples.map(s => s.lat);
    const longitudes = samples.map(s => s.lng);
    const accuracies = samples.map(s => s.accuracy);

    const finalLat = median(latitudes);
    const finalLng = median(longitudes);
    const finalAccuracy = median(accuracies);

    // Calculate consistency (max distance from center)
    const distances = samples.map(s => 
      haversineDistance(s.lat, s.lng, finalLat, finalLng)
    );
    const consistency = Math.max(...distances);

    const quality = getAccuracyQuality(finalAccuracy);

    return {
      lat: finalLat,
      lng: finalLng,
      accuracy: Math.round(finalAccuracy),
      quality,
      sampleCount: samples.length,
      consistency: Math.round(consistency),
      timestamp: Date.now(),
    };
  }, []);

  /**
   * ✨ ENHANCED: Standard location request (3 samples)
   * Best for most searches - good accuracy, reasonable wait time
   */
  const requestLocation = useCallback(async (options = {}) => {
    const { samples = SAMPLE_CONFIG.STANDARD_SAMPLES } = options;

    try {
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 0, total: samples, status: 'starting' });

      console.log(`📡 Collecting ${samples} GPS samples...`);

      // Collect samples
      const rawSamples = await collectSamples(samples, setProgress);

      if (rawSamples.length === 0) {
        throw new Error(
          'No valid GPS readings obtained. Please enable GPS and ensure you have a clear view of the sky.'
        );
      }

      // Filter outliers
      const filtered = filterOutliers(rawSamples);

      // Calculate final location
      const location = calculateLocation(filtered);

      // Validate final location
      if (!isInNigeria(location.lat, location.lng)) {
        throw new Error(
          'Your location is outside Nigeria. Please use the State/LGA filter to search.'
        );
      }

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setProgress(null);

      console.log('✅ Location detected:', location);
      return location;

    } catch (err) {
      console.error('Location error:', err);

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

      setLocationStatus('denied');
      setUserLocation(null);
      setAccuracy(null);
      setProgress(null);
      setError(error);
      
      throw error;
    }
  }, [collectSamples, calculateLocation]);

  /**
   * ✨ ENHANCED: Precise location request (5 samples)
   * Best for "Nearest" sorting - maximum accuracy
   */
  const requestPreciseLocation = useCallback(async () => {
    return requestLocation({ samples: SAMPLE_CONFIG.PRECISE_SAMPLES });
  }, [requestLocation]);

  /**
   * Quick location (1 sample) - for fast, non-critical searches
   * Falls back to old behavior if user needs immediate results
   */
  const requestQuickLocation = useCallback(async () => {
    try {
      setLocationStatus('requesting');
      setError(null);

      const reading = await getSingleReading();

      if (!isInNigeria(reading.lat, reading.lng)) {
        throw new Error(
          'Your location is outside Nigeria. Please use the State/LGA filter to search.'
        );
      }

      const quality = getAccuracyQuality(reading.accuracy);
      const location = {
        lat: reading.lat,
        lng: reading.lng,
        accuracy: Math.round(reading.accuracy),
        quality,
        sampleCount: 1,
        timestamp: reading.timestamp,
      };

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');

      console.log('⚡ Quick location detected:', location);
      return location;

    } catch (err) {
      console.error('Quick location error:', err);
      
      const errorMessage = err.message || 'Failed to get location';
      const error = new Error(errorMessage);
      error.code = err.code;

      setLocationStatus('denied');
      setUserLocation(null);
      setAccuracy(null);
      setError(error);
      
      throw error;
    }
  }, [getSingleReading]);

  // Debug logger
  useEffect(() => {
    console.log('📍🔍 Location state:', {
      userLocation,
      locationStatus,
      accuracy: accuracy ? `${accuracy}m` : null,
      hasError: !!error,
      progress,
    });
  }, [userLocation, locationStatus, accuracy, error, progress]);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setAccuracy(null);
    setLocationStatus('prompt');
    setError(null);
    setProgress(null);
  }, []);

  return {
    // State
    userLocation,
    locationStatus,
    accuracy,
    error,
    progress,        // ✨ NEW: Sampling progress for UI feedback
    
    // Methods
    requestLocation,          // Standard (3 samples) - default for most searches
    requestPreciseLocation,   // Precise (5 samples) - for "Nearest" sorting
    requestQuickLocation,     // Quick (1 sample) - for fast, non-critical use
    clearLocation,
  };
}