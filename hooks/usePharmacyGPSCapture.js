import { useState, useCallback, useRef } from 'react';

const GPS_CONFIG = {
  // Accuracy thresholds (meters)
  EXCELLENT_ACCURACY: 15,
  GOOD_ACCURACY: 30,
  ACCEPTABLE_ACCURACY: 50,
  MAX_ACCEPTABLE: 100,
  
  // Sampling configuration
  REGISTRATION_MIN_SAMPLES: 5,
  REGISTRATION_MAX_SAMPLES: 10,
  REGISTRATION_TARGET_ACCURACY: 20, // Stop early if we achieve this
  
  SEARCH_SAMPLE_COUNT: 1,
  
  // Timing
  ADAPTIVE_INTERVAL_GOOD: 800,  // Fast sampling when signal is good
  ADAPTIVE_INTERVAL_POOR: 2000, // Slower when signal is poor
  SINGLE_READING_TIMEOUT: 8000,
  PREFLIGHT_TIMEOUT: 5000,
  TOTAL_TIMEOUT: 45000,
  
  // Nigeria bounds
  NIGERIA_BOUNDS: {
    minLat: 4.0,
    maxLat: 13.9,
    minLng: 2.7,
    maxLng: 14.7,
  },
  
  // Outlier detection
  MAD_MULTIPLIER: 3.5, // More aggressive outlier removal
  MIN_SAMPLES_AFTER_FILTER: 3,
};

/**
 * Validate if coordinates are within Nigeria
 */
function isInNigeria(lat, lng) {
  const { minLat, maxLat, minLng, maxLng } = GPS_CONFIG.NIGERIA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Calculate median (robust central tendency)
 */
function median(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate Median Absolute Deviation (MAD) - more robust than standard deviation
 */
function calculateMAD(values, medianValue) {
  const deviations = values.map(v => Math.abs(v - medianValue));
  return median(deviations);
}

/**
 * Haversine distance calculation (meters)
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
 * Calculate weighted median based on inverse accuracy
 * Better accuracy = higher weight in final calculation
 */
function weightedMedian(values, weights) {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Combine and sort by value
  const combined = values.map((v, i) => ({ value: v, weight: weights[i] }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetWeight = totalWeight / 2;

  let cumulativeWeight = 0;
  for (let i = 0; i < combined.length; i++) {
    cumulativeWeight += combined[i].weight;
    if (cumulativeWeight >= targetWeight) {
      // Interpolate if needed
      if (i > 0 && cumulativeWeight - combined[i].weight < targetWeight) {
        const prevWeight = cumulativeWeight - combined[i].weight;
        const ratio = (targetWeight - prevWeight) / combined[i].weight;
        return combined[i - 1].value + ratio * (combined[i].value - combined[i - 1].value);
      }
      return combined[i].value;
    }
  }

  return combined[combined.length - 1].value;
}

/**
 * Pre-flight check to ensure GPS is ready
 */
async function preflightCheck() {
  try {
    const reading = await getSingleReading(GPS_CONFIG.PREFLIGHT_TIMEOUT);
    
    if (reading.accuracy > 500) {
      throw new Error('GPS signal is too weak. Please move outdoors with clear sky view.');
    }
    
    if (!isInNigeria(reading.latitude, reading.longitude)) {
      throw new Error('Location appears to be outside Nigeria. Please check your device location settings.');
    }
    
    return {
      ready: true,
      initialAccuracy: reading.accuracy,
      estimatedQuality: reading.accuracy < 50 ? 'good' : 'acceptable',
    };
  } catch (error) {
    throw new Error(`GPS not ready: ${error.message}`);
  }
}

/**
 * Get single GPS reading with timeout
 */
async function getSingleReading(timeout = GPS_CONFIG.SINGLE_READING_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('GPS reading timeout - signal may be blocked'));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
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
        maximumAge: 0, // Always get fresh reading
      }
    );
  });
}

/**
 * Adaptive sampling - stops when target accuracy is reached
 */
async function collectAdaptiveGPSSamples(onProgress) {
  const samples = [];
  const startTime = Date.now();
  let consecutiveFailures = 0;
  const maxFailures = 3;

  for (let i = 0; i < GPS_CONFIG.REGISTRATION_MAX_SAMPLES; i++) {
    try {
      // Check total timeout
      if (Date.now() - startTime > GPS_CONFIG.TOTAL_TIMEOUT) {
        console.warn('Total GPS timeout reached');
        break;
      }

      const reading = await getSingleReading();

      // Validate accuracy
      if (reading.accuracy > GPS_CONFIG.MAX_ACCEPTABLE) {
        consecutiveFailures++;
        console.warn(`Reading ${i + 1} rejected: poor accuracy (${reading.accuracy.toFixed(1)}m)`);
        onProgress?.({
          current: i + 1,
          total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES,
          status: 'poor_signal',
          accuracy: reading.accuracy,
          samplesCollected: samples.length,
        });
        
        if (consecutiveFailures >= maxFailures) {
          throw new Error('Too many consecutive poor readings. Please move to a location with better GPS signal.');
        }
        continue;
      }

      // Validate Nigeria bounds
      if (!isInNigeria(reading.latitude, reading.longitude)) {
        console.warn(`Reading ${i + 1} rejected: outside Nigeria`);
        onProgress?.({
          current: i + 1,
          total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES,
          status: 'outside_nigeria',
        });
        continue;
      }

      // Good reading!
      consecutiveFailures = 0;
      samples.push(reading);
      
      onProgress?.({
        current: i + 1,
        total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES,
        status: 'success',
        accuracy: reading.accuracy,
        samplesCollected: samples.length,
      });

      // Early stopping if we have enough samples and good accuracy
      if (samples.length >= GPS_CONFIG.REGISTRATION_MIN_SAMPLES) {
        const currentEstimate = calculateWeightedLocation(samples);
        if (currentEstimate.estimatedAccuracy <= GPS_CONFIG.REGISTRATION_TARGET_ACCURACY) {
          console.log(`🎯 Target accuracy achieved early! (${currentEstimate.estimatedAccuracy.toFixed(1)}m)`);
          break;
        }
      }

      // Adaptive interval based on current signal quality
      if (i < GPS_CONFIG.REGISTRATION_MAX_SAMPLES - 1) {
        const interval = reading.accuracy < 50 
          ? GPS_CONFIG.ADAPTIVE_INTERVAL_GOOD 
          : GPS_CONFIG.ADAPTIVE_INTERVAL_POOR;
        await new Promise(resolve => setTimeout(resolve, interval));
      }

    } catch (error) {
      consecutiveFailures++;
      console.error(`GPS reading ${i + 1} failed:`, error);
      onProgress?.({
        current: i + 1,
        total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES,
        status: 'error',
        error: error.message,
        samplesCollected: samples.length,
      });
      
      if (consecutiveFailures >= maxFailures) {
        throw new Error('GPS signal lost. Please check your device settings and try again.');
      }
    }
  }

  return samples;
}

/**
 * Advanced outlier filtering using MAD (Median Absolute Deviation)
 * More robust than standard deviation for GPS data
 */
function filterOutliersMAD(samples) {
  if (samples.length < 3) return samples;

  // Calculate center using simple median
  const centerLat = median(samples.map(s => s.latitude));
  const centerLng = median(samples.map(s => s.longitude));

  // Calculate distances from center
  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, centerLat, centerLng)
  );

  // Use MAD for robust outlier detection
  const medianDist = median(distances);
  const mad = calculateMAD(distances, medianDist);
  
  // Modified Z-score threshold (more robust than standard deviation)
  const threshold = medianDist + (GPS_CONFIG.MAD_MULTIPLIER * mad * 1.4826); // 1.4826 is consistency constant

  const filtered = samples.filter((_, i) => distances[i] <= threshold);

  const removedCount = samples.length - filtered.length;
  if (removedCount > 0) {
    console.log(`🔍 Filtered ${removedCount} outlier(s) using MAD (threshold: ${threshold.toFixed(1)}m)`);
  }

  // Only return filtered if we still have enough samples
  return filtered.length >= GPS_CONFIG.MIN_SAMPLES_AFTER_FILTER ? filtered : samples;
}

/**
 * Calculate weighted location using inverse accuracy as weights
 */
function calculateWeightedLocation(samples) {
  if (samples.length === 0) {
    throw new Error('No valid GPS samples collected');
  }

  if (samples.length < GPS_CONFIG.MIN_SAMPLES_AFTER_FILTER) {
    throw new Error(`Insufficient valid readings. Got ${samples.length}, need ${GPS_CONFIG.MIN_SAMPLES_AFTER_FILTER}`);
  }

  // Calculate weights (inverse of accuracy - better accuracy = higher weight)
  const weights = samples.map(s => 1 / Math.max(s.accuracy, 1));
  
  // Weighted median for latitude and longitude
  const latitude = weightedMedian(
    samples.map(s => s.latitude),
    weights
  );
  
  const longitude = weightedMedian(
    samples.map(s => s.longitude),
    weights
  );

  // Calculate estimated accuracy using weighted approach
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedAccuracy = samples.reduce((sum, s, i) => 
    sum + (s.accuracy * weights[i]), 0) / totalWeight;

  // Calculate spread and consistency
  const accuracies = samples.map(s => s.accuracy);
  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, latitude, longitude)
  );

  const finalLocation = {
    latitude,
    longitude,
    accuracy: Math.round(weightedAccuracy * 10) / 10, // 1 decimal place
    estimatedAccuracy: Math.round(weightedAccuracy),
    sampleCount: samples.length,
    spread: Math.round(Math.max(...accuracies) - Math.min(...accuracies)),
    consistency: Math.round(Math.max(...distances)),
    averageAccuracy: Math.round(median(accuracies)),
  };

  return finalLocation;
}

/**
 * Determine quality grade based on multiple factors
 */
function determineQuality(location) {
  const { estimatedAccuracy, consistency, sampleCount } = location;
  
  // Multi-factor quality assessment
  let score = 0;
  
  // Accuracy score (0-40 points)
  if (estimatedAccuracy <= 10) score += 40;
  else if (estimatedAccuracy <= 20) score += 30;
  else if (estimatedAccuracy <= 30) score += 20;
  else if (estimatedAccuracy <= 50) score += 10;
  
  // Consistency score (0-30 points)
  if (consistency <= 10) score += 30;
  else if (consistency <= 20) score += 20;
  else if (consistency <= 30) score += 10;
  else if (consistency <= 50) score += 5;
  
  // Sample count score (0-30 points)
  if (sampleCount >= 8) score += 30;
  else if (sampleCount >= 6) score += 20;
  else if (sampleCount >= 4) score += 10;
  else score += 5;
  
  // Determine grade
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'acceptable';
  return 'poor';
}

/**
 * Main GPS capture hook with professional-grade accuracy
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
        quality: reading.accuracy < 30 ? 'good' : 'acceptable',
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
   * Professional-grade accurate location capture
   * Uses adaptive sampling, weighted median, and MAD outlier filtering
   */
  const captureAccurateLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES, 
        status: 'preflight',
        message: 'Checking GPS readiness...'
      });

      if (!navigator.geolocation) {
        throw new Error('GPS not supported by your browser');
      }

      // Pre-flight check
      const preflightResult = await preflightCheck();
      console.log('✅ GPS preflight check passed:', preflightResult);

      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.REGISTRATION_MAX_SAMPLES, 
        status: 'starting',
        message: 'Starting GPS capture...'
      });

      // Collect samples with adaptive stopping
      const samples = await collectAdaptiveGPSSamples(setProgress);

      if (samples.length === 0) {
        throw new Error('No valid GPS readings obtained. Please ensure GPS is enabled and you have a clear sky view.');
      }

      console.log(`📊 Collected ${samples.length} samples`);

      // Filter outliers using MAD
      const filtered = filterOutliersMAD(samples);
      console.log(`✨ Using ${filtered.length} samples after outlier filtering`);

      // Calculate weighted final location
      const finalLocation = calculateWeightedLocation(filtered);

      // Validate final location
      if (!isInNigeria(finalLocation.latitude, finalLocation.longitude)) {
        throw new Error('Calculated location is outside Nigeria. Please ensure you are within Nigeria.');
      }

      // Determine quality grade
      const quality = determineQuality(finalLocation);

      const result = {
        ...finalLocation,
        quality,
        timestamp: Date.now(),
        method: 'weighted_median_mad',
      };

      console.log('🎯 Final location:', {
        lat: result.latitude.toFixed(6),
        lng: result.longitude.toFixed(6),
        accuracy: result.accuracy,
        quality: result.quality,
        samples: result.sampleCount,
        consistency: result.consistency,
      });

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
    captureAccurateLocation, // For registration (weighted median + MAD)
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
    return 'Location unavailable. Please check your device GPS settings and ensure you are outdoors with clear sky view.';
  } else if (error.code === 3) {
    return 'Location request timed out. Please try again in an area with better GPS signal.';
  } else if (error.message) {
    return error.message;
  }
  return 'Failed to capture location';
}

export { GPS_CONFIG };