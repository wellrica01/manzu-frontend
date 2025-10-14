import { useState, useCallback, useRef } from 'react';

const GPS_CONFIG = {
  // Accuracy thresholds
  EXCELLENT_ACCURACY: 20,
  GOOD_ACCURACY: 50,
  ACCEPTABLE_ACCURACY: 100,
  MAX_ACCEPTABLE: 200,
  
  // Sampling config for REGISTRATION (more samples = better accuracy)
  REGISTRATION_SAMPLE_COUNT: 5,
  SEARCH_SAMPLE_COUNT: 1, // For quick location detection
  SAMPLE_INTERVAL: 1000,
  MIN_SAMPLES_REQUIRED: 3,
  
  // Nigeria bounds
  NIGERIA_BOUNDS: {
    minLat: 4.0,
    maxLat: 13.9,
    minLng: 2.7,
    maxLng: 14.7,
  },
  
  SINGLE_READING_TIMEOUT: 10000,
  TOTAL_TIMEOUT: 60000,
};

/**
 * Validate if coordinates are within Nigeria
 */
function isInNigeria(lat, lng) {
  const { minLat, maxLat, minLng, maxLng } = GPS_CONFIG.NIGERIA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Calculate median (better than average for outlier resistance)
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
 * Get single GPS reading
 */
async function getSingleReading(timeout = GPS_CONFIG.SINGLE_READING_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('GPS reading timeout'));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Collect multiple GPS samples
 */
async function collectGPSSamples(sampleCount, onProgress) {
  const samples = [];
  const startTime = Date.now();

  for (let i = 0; i < sampleCount; i++) {
    try {
      if (Date.now() - startTime > GPS_CONFIG.TOTAL_TIMEOUT) {
        console.warn('Total GPS timeout reached');
        break;
      }

      const reading = await getSingleReading();

      // Validate accuracy
      if (reading.accuracy > GPS_CONFIG.MAX_ACCEPTABLE) {
        console.warn(`Reading ${i + 1} rejected: poor accuracy (${reading.accuracy}m)`);
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'poor_signal',
          accuracy: reading.accuracy,
        });
        continue;
      }

      // Validate Nigeria bounds
      if (!isInNigeria(reading.latitude, reading.longitude)) {
        console.warn(`Reading ${i + 1} rejected: outside Nigeria`);
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'outside_nigeria',
        });
        continue;
      }

      samples.push(reading);
      onProgress?.({
        current: i + 1,
        total: sampleCount,
        status: 'success',
        accuracy: reading.accuracy,
        samplesCollected: samples.length,
      });

      // Wait before next reading
      if (i < sampleCount - 1) {
        await new Promise(resolve => setTimeout(resolve, GPS_CONFIG.SAMPLE_INTERVAL));
      }

    } catch (error) {
      console.error(`GPS reading ${i + 1} failed:`, error);
      onProgress?.({
        current: i + 1,
        total: sampleCount,
        status: 'error',
        error: error.message,
      });
    }
  }

  return samples;
}

/**
 * Filter outliers using statistical methods
 */
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

  console.log(`Filtered ${samples.length - filtered.length} outliers (threshold: ${threshold.toFixed(1)}m)`);
  
  return filtered.length >= GPS_CONFIG.MIN_SAMPLES_REQUIRED ? filtered : samples;
}

/**
 * Calculate final location from samples
 */
function calculateFinalLocation(samples) {
  if (samples.length === 0) {
    throw new Error('No valid GPS samples collected');
  }

  if (samples.length < GPS_CONFIG.MIN_SAMPLES_REQUIRED) {
    throw new Error(`Insufficient valid readings. Got ${samples.length}, need ${GPS_CONFIG.MIN_SAMPLES_REQUIRED}`);
  }

  const latitudes = samples.map(s => s.latitude);
  const longitudes = samples.map(s => s.longitude);
  const accuracies = samples.map(s => s.accuracy);

  const finalLocation = {
    latitude: median(latitudes),
    longitude: median(longitudes),
    accuracy: Math.round(median(accuracies)),
    sampleCount: samples.length,
    spread: Math.round(Math.max(...accuracies) - Math.min(...accuracies)),
  };

  // Calculate consistency
  const centerLat = finalLocation.latitude;
  const centerLng = finalLocation.longitude;
  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, centerLat, centerLng)
  );
  finalLocation.consistency = Math.round(Math.max(...distances));

  return finalLocation;
}

/**
 * Main hook for GPS capture
 * Supports both single-reading (for search) and multi-sample (for registration)
 */
export function usePharmacyGPSCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Quick location capture (1 reading) - for search functionality
   */
  const captureQuickLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);

      const reading = await getSingleReading();

      if (!isInNigeria(reading.latitude, reading.longitude)) {
        throw new Error('Location is outside Nigeria');
      }

      const result = {
        latitude: reading.latitude,
        longitude: reading.longitude,
        accuracy: Math.round(reading.accuracy),
        quality: reading.accuracy < 50 ? 'good' : 'acceptable',
        timestamp: Date.now(),
      };

      setLocation(result);
      return result;

    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw { message: errorMessage, code: err.code };
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Accurate location capture (5 readings) - for registration
   */
  const captureAccurateLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ current: 0, total: GPS_CONFIG.REGISTRATION_SAMPLE_COUNT, status: 'starting' });

      if (!navigator.geolocation) {
        throw new Error('GPS not supported by your browser');
      }

      // Collect samples
      const samples = await collectGPSSamples(
        GPS_CONFIG.REGISTRATION_SAMPLE_COUNT,
        setProgress
      );

      if (samples.length === 0) {
        throw new Error('No valid GPS readings obtained. Please ensure GPS is enabled and you have a clear sky view.');
      }

      // Filter outliers
      const filtered = filterOutliers(samples);

      // Calculate final location
      const finalLocation = calculateFinalLocation(filtered);

      // Validate final location
      if (!isInNigeria(finalLocation.latitude, finalLocation.longitude)) {
        throw new Error('Calculated location is outside Nigeria. Please ensure you are within Nigeria.');
      }

      // Determine quality
      let quality = 'poor';
      if (finalLocation.accuracy < GPS_CONFIG.EXCELLENT_ACCURACY) {
        quality = 'excellent';
      } else if (finalLocation.accuracy < GPS_CONFIG.GOOD_ACCURACY) {
        quality = 'good';
      } else if (finalLocation.accuracy < GPS_CONFIG.ACCEPTABLE_ACCURACY) {
        quality = 'acceptable';
      }

      const result = {
        ...finalLocation,
        quality,
        timestamp: Date.now(),
      };

      setLocation(result);
      return result;

    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw { message: errorMessage, code: err.code };
    } finally {
      setIsCapturing(false);
      setProgress(null);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    // State
    isCapturing,
    progress,
    location,
    error,
    
    // Methods
    captureQuickLocation,    // For search (1 reading)
    captureAccurateLocation, // For registration (5 readings)
    clearLocation,
  };
}

/**
 * Helper to format error messages
 */
function getErrorMessage(error) {
  if (error.code === 1) {
    return 'Location permission denied. Please enable location access in your browser settings.';
  } else if (error.code === 2) {
    return 'Location unavailable. Please check your device GPS settings and ensure you are outdoors.';
  } else if (error.code === 3) {
    return 'Location request timed out. Please try again.';
  } else if (error.message) {
    return error.message;
  }
  return 'Failed to capture location';
}

export { GPS_CONFIG };