import { useState, useCallback, useRef } from 'react';

/**
 * ========================================================================
 * UNIFIED GPS CAPTURE HOOK
 * ========================================================================
 * 
 * Supports BOTH pharmacy registration and user location detection
 * with zero compromise on accuracy or functionality.
 * 
 * PHARMACY MODE (capturePharmacyLocation):
 * - 5-10 adaptive samples with early stopping
 * - Weighted median with MAD outlier filtering
 * - Target accuracy: 10-30m
 * - Use case: One-time registration, accuracy is critical
 * 
 * USER QUICK MODE (captureUserLocation):
 * - 2-3 samples for speed/accuracy balance
 * - Simple median filtering
 * - Target accuracy: 30-100m
 * - Use case: Search functionality, speed matters
 * 
 * USER ACCURATE MODE (captureUserLocationAccurate):
 * - 3-4 samples with stricter validation
 * - Median filtering with accuracy weighting
 * - Target accuracy: 20-60m
 * - Use case: Distance calculations, accuracy matters
 * ========================================================================
 */

const GPS_CONFIG = {
  // Accuracy thresholds (meters)
  EXCELLENT_ACCURACY: 15,
  GOOD_ACCURACY: 30,
  ACCEPTABLE_ACCURACY: 50,
  POOR_ACCURACY: 100,
  
  // Pharmacy registration config (HIGHEST accuracy)
  PHARMACY: {
    MIN_SAMPLES: 5,
    MAX_SAMPLES: 10,
    TARGET_ACCURACY: 20,        // Stop early if achieved
    MAX_ACCEPTABLE: 100,        // Reject worse readings
    TIMEOUT_PER_READING: 8000,
    INTERVAL_GOOD: 800,
    INTERVAL_POOR: 2000,
    TOTAL_TIMEOUT: 45000,
    MIN_SAMPLES_REQUIRED: 3,
    MAD_MULTIPLIER: 3.5,
  },
  
  // User quick mode (SPEED priority)
  USER_QUICK: {
    SAMPLES: 2,
    MAX_ACCEPTABLE: 200,
    TIMEOUT_PER_READING: 6000,
    INTERVAL: 1000,
    TOTAL_TIMEOUT: 15000,
  },
  
  // User accurate mode (ACCURACY priority)
  USER_ACCURATE: {
    SAMPLES: 3,
    MAX_ACCEPTABLE: 100,
    TIMEOUT_PER_READING: 8000,
    INTERVAL: 1200,
    TOTAL_TIMEOUT: 30000,
  },
  
  // Nigeria bounds
  NIGERIA_BOUNDS: {
    minLat: 4.0,
    maxLat: 13.9,
    minLng: 2.7,
    maxLng: 14.7,
  },
};

/**
 * ========================================================================
 * UTILITY FUNCTIONS (Shared by all modes)
 * ========================================================================
 */

function isInNigeria(lat, lng) {
  const { minLat, maxLat, minLng, maxLng } = GPS_CONFIG.NIGERIA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

function median(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateMAD(values, medianValue) {
  const deviations = values.map(v => Math.abs(v - medianValue));
  return median(deviations);
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

function weightedMedian(values, weights) {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const combined = values.map((v, i) => ({ value: v, weight: weights[i] }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetWeight = totalWeight / 2;

  let cumulativeWeight = 0;
  for (let i = 0; i < combined.length; i++) {
    cumulativeWeight += combined[i].weight;
    if (cumulativeWeight >= targetWeight) {
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
 * Get single GPS reading
 */
async function getSingleReading(timeout) {
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
        maximumAge: 0, // Always fresh
      }
    );
  });
}

/**
 * Pre-flight check (pharmacy only)
 */
async function preflightCheck() {
  try {
    const reading = await getSingleReading(5000);
    
    if (reading.accuracy > 500) {
      throw new Error('GPS signal is too weak. Please move outdoors with clear sky view.');
    }
    
    if (!isInNigeria(reading.latitude, reading.longitude)) {
      throw new Error('Location appears to be outside Nigeria. Please check your device settings.');
    }
    
    return { ready: true, initialAccuracy: reading.accuracy };
  } catch (error) {
    throw new Error(`GPS not ready: ${error.message}`);
  }
}

/**
 * ========================================================================
 * PHARMACY MODE: Advanced adaptive sampling with early stopping
 * ========================================================================
 */
async function collectPharmacySamples(onProgress) {
  const samples = [];
  const startTime = Date.now();
  const config = GPS_CONFIG.PHARMACY;
  let consecutiveFailures = 0;

  for (let i = 0; i < config.MAX_SAMPLES; i++) {
    try {
      if (Date.now() - startTime > config.TOTAL_TIMEOUT) {
        console.warn('⏱️ Total GPS timeout reached');
        break;
      }

      const reading = await getSingleReading(config.TIMEOUT_PER_READING);

      // Validate accuracy
      if (reading.accuracy > config.MAX_ACCEPTABLE) {
        consecutiveFailures++;
        console.warn(`Reading ${i + 1} rejected: accuracy ${reading.accuracy.toFixed(1)}m`);
        onProgress?.({
          current: i + 1,
          total: config.MAX_SAMPLES,
          status: 'poor_signal',
          accuracy: reading.accuracy,
          samplesCollected: samples.length,
        });
        
        if (consecutiveFailures >= 3) {
          throw new Error('Too many poor readings. Please move to a location with better GPS signal.');
        }
        continue;
      }

      // Validate Nigeria bounds
      if (!isInNigeria(reading.latitude, reading.longitude)) {
        console.warn(`Reading ${i + 1} rejected: outside Nigeria`);
        onProgress?.({
          current: i + 1,
          total: config.MAX_SAMPLES,
          status: 'outside_nigeria',
        });
        continue;
      }

      // Good reading!
      consecutiveFailures = 0;
      samples.push(reading);
      
      onProgress?.({
        current: i + 1,
        total: config.MAX_SAMPLES,
        status: 'success',
        accuracy: reading.accuracy,
        samplesCollected: samples.length,
      });

      // Early stopping for pharmacy if target accuracy achieved
      if (samples.length >= config.MIN_SAMPLES) {
        const currentEstimate = calculatePharmacyLocation(samples);
        if (currentEstimate.estimatedAccuracy <= config.TARGET_ACCURACY) {
          console.log(`🎯 Pharmacy target accuracy achieved! (${currentEstimate.estimatedAccuracy.toFixed(1)}m)`);
          break;
        }
      }

      // Adaptive interval
      if (i < config.MAX_SAMPLES - 1) {
        const interval = reading.accuracy < 50 ? config.INTERVAL_GOOD : config.INTERVAL_POOR;
        await new Promise(resolve => setTimeout(resolve, interval));
      }

    } catch (error) {
      consecutiveFailures++;
      console.error(`GPS reading ${i + 1} failed:`, error);
      onProgress?.({
        current: i + 1,
        total: config.MAX_SAMPLES,
        status: 'error',
        error: error.message,
        samplesCollected: samples.length,
      });
      
      if (consecutiveFailures >= 3) {
        throw new Error('GPS signal lost. Please check your device settings.');
      }
    }
  }

  return samples;
}

/**
 * MAD outlier filtering (pharmacy only)
 */
function filterOutliersMAD(samples) {
  if (samples.length < 3) return samples;

  const centerLat = median(samples.map(s => s.latitude));
  const centerLng = median(samples.map(s => s.longitude));

  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, centerLat, centerLng)
  );

  const medianDist = median(distances);
  const mad = calculateMAD(distances, medianDist);
  const threshold = medianDist + (GPS_CONFIG.PHARMACY.MAD_MULTIPLIER * mad * 1.4826);

  const filtered = samples.filter((_, i) => distances[i] <= threshold);

  if (samples.length - filtered.length > 0) {
    console.log(`🔍 Filtered ${samples.length - filtered.length} outlier(s) (threshold: ${threshold.toFixed(1)}m)`);
  }

  return filtered.length >= GPS_CONFIG.PHARMACY.MIN_SAMPLES_REQUIRED ? filtered : samples;
}

/**
 * Calculate pharmacy location (weighted median)
 */
function calculatePharmacyLocation(samples) {
  if (samples.length === 0) {
    throw new Error('No valid GPS samples collected');
  }

  if (samples.length < GPS_CONFIG.PHARMACY.MIN_SAMPLES_REQUIRED) {
    throw new Error(`Insufficient readings. Got ${samples.length}, need ${GPS_CONFIG.PHARMACY.MIN_SAMPLES_REQUIRED}`);
  }

  // Weighted median
  const weights = samples.map(s => 1 / Math.max(s.accuracy, 1));
  const latitude = weightedMedian(samples.map(s => s.latitude), weights);
  const longitude = weightedMedian(samples.map(s => s.longitude), weights);

  // Calculate estimated accuracy
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedAccuracy = samples.reduce((sum, s, i) => 
    sum + (s.accuracy * weights[i]), 0) / totalWeight;

  // Calculate consistency
  const distances = samples.map(s => 
    haversineDistance(s.latitude, s.longitude, latitude, longitude)
  );

  return {
    latitude,
    longitude,
    accuracy: Math.round(weightedAccuracy * 10) / 10,
    estimatedAccuracy: Math.round(weightedAccuracy),
    sampleCount: samples.length,
    consistency: Math.round(Math.max(...distances)),
    spread: Math.round(Math.max(...samples.map(s => s.accuracy)) - Math.min(...samples.map(s => s.accuracy))),
  };
}

/**
 * ========================================================================
 * USER MODE: Simple sampling for speed
 * ========================================================================
 */
async function collectUserSamples(config, onProgress) {
  const samples = [];

  for (let i = 0; i < config.SAMPLES; i++) {
    try {
      const reading = await getSingleReading(config.TIMEOUT_PER_READING);

      // Validate accuracy
      if (reading.accuracy > config.MAX_ACCEPTABLE) {
        console.warn(`User reading ${i + 1} rejected: accuracy ${reading.accuracy.toFixed(1)}m`);
        onProgress?.({
          current: i + 1,
          total: config.SAMPLES,
          status: 'poor_accuracy',
          accuracy: reading.accuracy,
        });
        continue;
      }

      // Validate Nigeria bounds
      if (!isInNigeria(reading.latitude, reading.longitude)) {
        console.warn(`User reading ${i + 1} rejected: outside Nigeria`);
        onProgress?.({
          current: i + 1,
          total: config.SAMPLES,
          status: 'outside_nigeria',
        });
        continue;
      }

      samples.push(reading);
      onProgress?.({
        current: i + 1,
        total: config.SAMPLES,
        status: 'success',
        accuracy: reading.accuracy,
        samplesCollected: samples.length,
      });

      // Wait before next reading
      if (i < config.SAMPLES - 1) {
        await new Promise(resolve => setTimeout(resolve, config.INTERVAL));
      }

    } catch (error) {
      console.error(`User GPS reading ${i + 1} failed:`, error);
      onProgress?.({
        current: i + 1,
        total: config.SAMPLES,
        status: 'error',
        error: error.message,
      });
    }
  }

  return samples;
}

/**
 * Calculate user location (simple median)
 */
function calculateUserLocation(samples) {
  if (samples.length === 0) {
    throw new Error('No valid GPS readings obtained');
  }

  const lat = median(samples.map(s => s.latitude));
  const lng = median(samples.map(s => s.longitude));
  const accuracy = median(samples.map(s => s.accuracy));

  return {
    lat,
    lng,
    accuracy: Math.round(accuracy),
    sampleCount: samples.length,
  };
}

/**
 * Determine quality grade
 */
function determineQuality(accuracy, consistency = 0, sampleCount = 1) {
  let score = 0;
  
  // Accuracy score (0-40 points)
  if (accuracy <= 10) score += 40;
  else if (accuracy <= 20) score += 30;
  else if (accuracy <= 30) score += 20;
  else if (accuracy <= 50) score += 10;
  
  // Consistency score (0-30 points) - only for pharmacy
  if (consistency !== undefined) {
    if (consistency <= 10) score += 30;
    else if (consistency <= 20) score += 20;
    else if (consistency <= 30) score += 10;
    else if (consistency <= 50) score += 5;
  }
  
  // Sample count score (0-30 points) - only for pharmacy
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
 * Format error messages
 */
function getErrorMessage(error) {
  if (error.code === 1) {
    return 'Location permission denied. Please enable location access in your browser settings.';
  } else if (error.code === 2) {
    return 'Location unavailable. Please check your GPS settings and ensure you have signal.';
  } else if (error.code === 3) {
    return 'Location request timed out. Please try again.';
  } else if (error.message) {
    return error.message;
  }
  return 'Failed to capture location';
}

/**
 * ========================================================================
 * MAIN UNIFIED HOOK
 * ========================================================================
 */
export function useGPSCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * PHARMACY: Professional-grade location capture
   * - 5-10 adaptive samples
   * - Weighted median with MAD filtering
   * - Pre-flight check
   * - Target: 10-30m accuracy
   */
  const capturePharmacyLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.PHARMACY.MAX_SAMPLES, 
        status: 'preflight',
        message: 'Checking GPS readiness...'
      });

      if (!navigator.geolocation) {
        throw new Error('GPS not supported by your browser');
      }

      // Pre-flight check
      await preflightCheck();
      console.log('✅ GPS preflight check passed');

      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.PHARMACY.MAX_SAMPLES, 
        status: 'starting',
        message: 'Starting GPS capture...'
      });

      // Collect samples
      const samples = await collectPharmacySamples(setProgress);

      if (samples.length === 0) {
        throw new Error('No valid GPS readings obtained. Please ensure GPS is enabled and you have a clear sky view.');
      }

      console.log(`📊 Collected ${samples.length} pharmacy samples`);

      // Filter outliers
      const filtered = filterOutliersMAD(samples);
      console.log(`✨ Using ${filtered.length} samples after outlier filtering`);

      // Calculate location
      const finalLocation = calculatePharmacyLocation(filtered);

      // Validate
      if (!isInNigeria(finalLocation.latitude, finalLocation.longitude)) {
        throw new Error('Calculated location is outside Nigeria.');
      }

      // Determine quality
      const quality = determineQuality(
        finalLocation.estimatedAccuracy,
        finalLocation.consistency,
        finalLocation.sampleCount
      );

      const result = {
        ...finalLocation,
        quality,
        timestamp: Date.now(),
        mode: 'pharmacy',
        method: 'weighted_median_mad',
      };

      console.log('🎯 Pharmacy location:', {
        lat: result.latitude.toFixed(6),
        lng: result.longitude.toFixed(6),
        accuracy: result.accuracy,
        quality: result.quality,
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

  /**
   * USER QUICK: Fast location detection for search
   * - 2 samples (balance speed/accuracy)
   * - Simple median
   * - Target: 30-100m accuracy
   */
  const captureUserLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.USER_QUICK.SAMPLES, 
        status: 'starting' 
      });

      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by your browser');
      }

      // Collect samples
      const samples = await collectUserSamples(GPS_CONFIG.USER_QUICK, setProgress);

      if (samples.length === 0) {
        throw new Error('Unable to get location. Please ensure GPS is enabled.');
      }

      // Calculate location
      const location = calculateUserLocation(samples);

      // Determine quality (simple for user mode)
      let quality = 'poor';
      if (location.accuracy < GPS_CONFIG.EXCELLENT_ACCURACY) quality = 'excellent';
      else if (location.accuracy < GPS_CONFIG.GOOD_ACCURACY) quality = 'good';
      else if (location.accuracy < GPS_CONFIG.ACCEPTABLE_ACCURACY) quality = 'acceptable';

      const result = {
        ...location,
        quality,
        timestamp: Date.now(),
        mode: 'user_quick',
        method: 'median',
      };

      console.log('✅ User quick location:', {
        lat: result.lat.toFixed(6),
        lng: result.lng.toFixed(6),
        accuracy: result.accuracy,
        quality: result.quality,
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

  /**
   * USER ACCURATE: More accurate location for distance calculations
   * - 3 samples (better accuracy)
   * - Simple median with stricter validation
   * - Target: 20-60m accuracy
   */
  const captureUserLocationAccurate = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ 
        current: 0, 
        total: GPS_CONFIG.USER_ACCURATE.SAMPLES, 
        status: 'starting' 
      });

      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by your browser');
      }

      // Collect samples with stricter config
      const samples = await collectUserSamples(GPS_CONFIG.USER_ACCURATE, setProgress);

      if (samples.length < 2) {
        throw new Error('Unable to get accurate location. Please move outdoors for better GPS signal.');
      }

      // Calculate location
      const location = calculateUserLocation(samples);

      // Determine quality
      let quality = 'poor';
      if (location.accuracy < GPS_CONFIG.EXCELLENT_ACCURACY) quality = 'excellent';
      else if (location.accuracy < GPS_CONFIG.GOOD_ACCURACY) quality = 'good';
      else if (location.accuracy < GPS_CONFIG.ACCEPTABLE_ACCURACY) quality = 'acceptable';

      const result = {
        ...location,
        quality,
        timestamp: Date.now(),
        mode: 'user_accurate',
        method: 'median',
      };

      console.log('🎯 User accurate location:', {
        lat: result.lat.toFixed(6),
        lng: result.lng.toFixed(6),
        accuracy: result.accuracy,
        quality: result.quality,
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
    capturePharmacyLocation,      // For pharmacy registration (5-10 samples, weighted)
    captureUserLocation,          // For user search (2 samples, fast)
    captureUserLocationAccurate,  // For distance calculations (3 samples, accurate)
    clearLocation,
  };
}

// Export configs for external use if needed
export { GPS_CONFIG };