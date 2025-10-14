import { useState, useEffect, useCallback, useRef } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

const LOCATION_CONFIG = {
  // For user search - balance speed vs accuracy
  QUICK_SAMPLES: 2,           // 2 readings for better accuracy
  QUICK_TIMEOUT: 6000,        // 6s per reading
  QUICK_INTERVAL: 1000,       // 1s between readings
  QUICK_MAX_ACCURACY: 200,    // Reject readings worse than 200m
  
  // For distance calculation - need good accuracy
  ACCURATE_SAMPLES: 3,        // 3 readings for distance calculations
  ACCURATE_TIMEOUT: 8000,     // 8s per reading
  ACCURATE_INTERVAL: 1200,    // 1.2s between readings
  ACCURATE_MAX_ACCURACY: 100, // Reject readings worse than 100m
  
  // Quality thresholds
  EXCELLENT_ACCURACY: 30,
  GOOD_ACCURACY: 80,
  ACCEPTABLE_ACCURACY: 150,
};

function isInNigeria(lat, lng) {
  return lat >= NIGERIA_BOUNDS.minLat && 
         lat <= NIGERIA_BOUNDS.maxLat && 
         lng >= NIGERIA_BOUNDS.minLng && 
         lng <= NIGERIA_BOUNDS.maxLng;
}

/**
 * Calculate median
 */
function median(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Get single GPS reading
 */
async function getSingleReading(timeout) {
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
        maximumAge: 0, // ALWAYS get fresh reading
      }
    );
  });
}

/**
 * Collect multiple samples for better accuracy
 */
async function collectLocationSamples(sampleCount, maxAccuracy, timeout, interval, onProgress) {
  const samples = [];

  for (let i = 0; i < sampleCount; i++) {
    try {
      const reading = await getSingleReading(timeout);

      // Validate accuracy
      if (reading.accuracy > maxAccuracy) {
        console.warn(`Reading ${i + 1} rejected: accuracy ${reading.accuracy.toFixed(1)}m (max: ${maxAccuracy}m)`);
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'poor_accuracy',
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

      // Wait before next reading (except last)
      if (i < sampleCount - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
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
 * Calculate best location from samples
 */
function calculateBestLocation(samples) {
  if (samples.length === 0) {
    throw new Error('No valid GPS readings obtained');
  }

  // Use median for robustness
  const latitude = median(samples.map(s => s.latitude));
  const longitude = median(samples.map(s => s.longitude));
  const accuracy = median(samples.map(s => s.accuracy));

  // Determine quality
  let quality = 'poor';
  if (accuracy < LOCATION_CONFIG.EXCELLENT_ACCURACY) {
    quality = 'excellent';
  } else if (accuracy < LOCATION_CONFIG.GOOD_ACCURACY) {
    quality = 'good';
  } else if (accuracy < LOCATION_CONFIG.ACCEPTABLE_ACCURACY) {
    quality = 'acceptable';
  }

  return {
    lat: latitude,
    lng: longitude,
    accuracy: Math.round(accuracy),
    quality,
    sampleCount: samples.length,
    timestamp: Date.now(),
  };
}

/**
 * Hook for detecting user's geolocation with configurable accuracy
 * 
 * Features:
 * - Multi-sample collection for better accuracy
 * - Accuracy validation
 * - Nigeria bounds validation
 * - Two modes: quick (for search) and accurate (for distance)
 * - Progress tracking
 * - Quality assessment
 */
export function useLocationDetection() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Quick location detection (2 samples) - for initial search
   * Balance between speed and accuracy
   */
  const requestLocation = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by your browser');
      }

      setIsCapturing(true);
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 0, total: LOCATION_CONFIG.QUICK_SAMPLES, status: 'starting' });

      // Collect samples
      const samples = await collectLocationSamples(
        LOCATION_CONFIG.QUICK_SAMPLES,
        LOCATION_CONFIG.QUICK_MAX_ACCURACY,
        LOCATION_CONFIG.QUICK_TIMEOUT,
        LOCATION_CONFIG.QUICK_INTERVAL,
        setProgress
      );

      if (samples.length === 0) {
        throw new Error('Unable to get location. Please ensure GPS is enabled and you have signal.');
      }

      // Calculate best location
      const location = calculateBestLocation(samples);

      console.log('✅ Quick location detected:', {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        accuracy: location.accuracy,
        quality: location.quality,
        samples: location.sampleCount,
      });

      setUserLocation(location);
      setLocationStatus('granted');
      setProgress(null);

      return location;

    } catch (err) {
      console.error('Location error:', err);
      
      const errorMessage = getErrorMessage(err);
      setError(new Error(errorMessage));
      setLocationStatus('denied');
      setUserLocation(null);
      setProgress(null);
      
      throw new Error(errorMessage);

    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Accurate location detection (3 samples) - for distance calculations
   * Prioritizes accuracy over speed
   */
  const requestAccurateLocation = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by your browser');
      }

      setIsCapturing(true);
      setLocationStatus('requesting');
      setError(null);
      setProgress({ current: 0, total: LOCATION_CONFIG.ACCURATE_SAMPLES, status: 'starting' });

      // Collect more samples with stricter accuracy requirements
      const samples = await collectLocationSamples(
        LOCATION_CONFIG.ACCURATE_SAMPLES,
        LOCATION_CONFIG.ACCURATE_MAX_ACCURACY,
        LOCATION_CONFIG.ACCURATE_TIMEOUT,
        LOCATION_CONFIG.ACCURATE_INTERVAL,
        setProgress
      );

      if (samples.length < 2) {
        throw new Error('Unable to get accurate location. Please move outdoors for better GPS signal.');
      }

      // Calculate best location
      const location = calculateBestLocation(samples);

      // Warn if accuracy is poor
      if (location.quality === 'poor' || location.accuracy > 100) {
        console.warn('⚠️ Location accuracy is low:', location.accuracy + 'm');
      }

      console.log('🎯 Accurate location detected:', {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        accuracy: location.accuracy,
        quality: location.quality,
        samples: location.sampleCount,
      });

      setUserLocation(location);
      setLocationStatus('granted');
      setProgress(null);

      return location;

    } catch (err) {
      console.error('Accurate location error:', err);
      
      const errorMessage = getErrorMessage(err);
      setError(new Error(errorMessage));
      setLocationStatus('denied');
      setUserLocation(null);
      setProgress(null);
      
      throw new Error(errorMessage);

    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Check if location permission is granted
   */
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (err) {
      console.error('Permission check error:', err);
      return 'prompt';
    }
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setLocationStatus('prompt');
    setError(null);
    setProgress(null);
  }, []);

  // Debug logger
  useEffect(() => {
    if (userLocation) {
      console.log('🗺️ Location state:', {
        userLocation,
        locationStatus,
        accuracy: userLocation.accuracy + 'm',
        quality: userLocation.quality,
        hasError: !!error,
      });
    }
  }, [userLocation, locationStatus, error]);

  return {
    // State
    userLocation,
    locationStatus,
    error,
    progress,
    isCapturing,
    
    // Methods
    requestLocation,          // Quick (2 samples) for search
    requestAccurateLocation,  // Accurate (3 samples) for distance
    checkPermission,
    clearLocation,
  };
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
  return 'Failed to get location';
}