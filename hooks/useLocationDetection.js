import { useState, useEffect, useCallback } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

// ✨ NEW: Accuracy thresholds
const ACCURACY_CONFIG = {
  EXCELLENT: 20,  // < 20m = excellent
  GOOD: 50,       // < 50m = good
  ACCEPTABLE: 100, // < 100m = acceptable
  MAX: 200,       // > 200m = reject
};

function isInNigeria(lat, lng) {
  return lat >= NIGERIA_BOUNDS.minLat && 
         lat <= NIGERIA_BOUNDS.maxLat && 
         lng >= NIGERIA_BOUNDS.minLng && 
         lng <= NIGERIA_BOUNDS.maxLng;
}

/**
 * ✨ ENHANCED: Get accuracy quality label
 */
function getAccuracyQuality(accuracy) {
  if (accuracy < ACCURACY_CONFIG.EXCELLENT) return 'excellent';
  if (accuracy < ACCURACY_CONFIG.GOOD) return 'good';
  if (accuracy < ACCURACY_CONFIG.ACCEPTABLE) return 'acceptable';
  return 'poor';
}

/**
 * Hook for detecting user's geolocation (SEARCH functionality)
 * 
 * ✨ IMPROVEMENTS:
 * - No cached readings (maximumAge: 0)
 * - Accuracy validation and retry logic
 * - Quality reporting
 * - Optional multi-sample for better precision
 */
export function useLocationDetection() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // ✨ NEW: Track accuracy

  /**
   * ✨ ENHANCED: Get single reading with quality validation
   */
  const getSingleReading = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const gpsOptions = {
        timeout: 10000,
        maximumAge: 0, // ✅ ALWAYS get fresh reading (was 60000)
        enableHighAccuracy: true,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (err) => reject(err),
        gpsOptions
      );
    });
  }, []);

  /**
   * ✨ ENHANCED: Request location with quality validation
   */
  const requestLocation = useCallback(async (options = {}) => {
    const { 
      allowPoorAccuracy = false, // ✨ NEW: Optionally allow poor accuracy
      maxRetries = 2              // ✨ NEW: Retry if accuracy is poor
    } = options;

    try {
      setLocationStatus('requesting');
      setError(null);

      let bestReading = null;
      let attempts = 0;

      // ✨ Try to get a good reading (with retries)
      while (attempts < maxRetries) {
        attempts++;
        console.log(`📍 GPS attempt ${attempts}/${maxRetries}...`);

        try {
          const reading = await getSingleReading();

          // Validate Nigeria bounds
          if (!isInNigeria(reading.lat, reading.lng)) {
            throw new Error(
              'Your location is outside Nigeria. Please use the State/LGA filter to search.'
            );
          }

          // Check if this is the best reading so far
          if (!bestReading || reading.accuracy < bestReading.accuracy) {
            bestReading = reading;
          }

          const quality = getAccuracyQuality(reading.accuracy);
          console.log(`📊 Reading ${attempts}: ${reading.accuracy.toFixed(1)}m (${quality})`);

          // ✨ Accept if accuracy is good enough
          if (reading.accuracy < ACCURACY_CONFIG.ACCEPTABLE) {
            break; // Good enough, stop retrying
          }

          // ✨ Reject if accuracy is too poor
          if (reading.accuracy > ACCURACY_CONFIG.MAX && !allowPoorAccuracy) {
            if (attempts < maxRetries) {
              console.log('⚠️ Poor accuracy, retrying...');
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
              continue;
            }
          }

        } catch (err) {
          if (attempts >= maxRetries) throw err;
          console.log('⚠️ Reading failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!bestReading) {
        throw new Error('Failed to get GPS location after retries');
      }

      // ✨ Reject if final accuracy is too poor and not allowed
      if (bestReading.accuracy > ACCURACY_CONFIG.MAX && !allowPoorAccuracy) {
        throw new Error(
          `GPS accuracy too poor (${Math.round(bestReading.accuracy)}m). Please move to an area with better signal.`
        );
      }

      const quality = getAccuracyQuality(bestReading.accuracy);
      const location = {
        lat: bestReading.lat,
        lng: bestReading.lng,
        accuracy: Math.round(bestReading.accuracy),
        quality,
        timestamp: bestReading.timestamp,
      };

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setError(null);

      console.log('✅ Location detected:', location);
      return location;

    } catch (err) {
      console.error('Location error:', err);

      let errorMessage = 'Failed to get location';
      if (err.code === 1) {
        errorMessage = 'Location permission denied';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please enable GPS and try outdoors.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out';
      } else if (err.message) {
        errorMessage = err.message;
      }

      const error = new Error(errorMessage);
      error.code = err.code;

      setLocationStatus('denied');
      setUserLocation(null);
      setAccuracy(null);
      setError(error);
      throw error;
    }
  }, [getSingleReading]);

  /**
   * ✨ NEW: Get high-precision location (3 samples)
   * Use this when accuracy is critical (e.g., "Nearest" sort)
   */
  const requestPreciseLocation = useCallback(async () => {
    try {
      setLocationStatus('requesting');
      setError(null);

      console.log('📍 Collecting 3 GPS samples for high precision...');

      const samples = [];
      for (let i = 0; i < 3; i++) {
        const reading = await getSingleReading();
        
        if (!isInNigeria(reading.lat, reading.lng)) {
          throw new Error('Your location is outside Nigeria');
        }

        if (reading.accuracy < ACCURACY_CONFIG.MAX) {
          samples.push(reading);
          console.log(`📊 Sample ${i + 1}: ${reading.accuracy.toFixed(1)}m`);
        }

        if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (samples.length === 0) {
        throw new Error('No valid GPS readings obtained');
      }

      // Calculate median position
      const latitudes = samples.map(s => s.lat);
      const longitudes = samples.map(s => s.lng);
      const accuracies = samples.map(s => s.accuracy);

      const sortedLats = [...latitudes].sort((a, b) => a - b);
      const sortedLngs = [...longitudes].sort((a, b) => a - b);
      const sortedAccs = [...accuracies].sort((a, b) => a - b);

      const medianLat = sortedLats[Math.floor(sortedLats.length / 2)];
      const medianLng = sortedLngs[Math.floor(sortedLngs.length / 2)];
      const medianAcc = sortedAccs[Math.floor(sortedAccs.length / 2)];

      const quality = getAccuracyQuality(medianAcc);
      const location = {
        lat: medianLat,
        lng: medianLng,
        accuracy: Math.round(medianAcc),
        quality,
        sampleCount: samples.length,
        timestamp: Date.now(),
      };

      setUserLocation(location);
      setAccuracy(location.accuracy);
      setLocationStatus('granted');
      setError(null);

      console.log('✅ Precise location calculated:', location);
      return location;

    } catch (err) {
      console.error('Precise location error:', err);
      setLocationStatus('denied');
      setUserLocation(null);
      setAccuracy(null);
      setError(err);
      throw err;
    }
  }, [getSingleReading]);

  // Debug logger
  useEffect(() => {
    console.log('📍🔍 Location state:', {
      userLocation,
      locationStatus,
      accuracy: accuracy ? `${accuracy}m` : null,
      hasError: !!error,
    });
  }, [userLocation, locationStatus, accuracy, error]);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setAccuracy(null);
    setLocationStatus('prompt');
    setError(null);
  }, []);

  return {
    userLocation,
    locationStatus,
    accuracy,        // ✨ NEW: Expose accuracy
    error,
    requestLocation,
    requestPreciseLocation, // ✨ NEW: For critical searches
    clearLocation,
  };
}