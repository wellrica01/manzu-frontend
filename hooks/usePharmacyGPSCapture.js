import { useState, useCallback, useRef } from 'react';

// Nigeria bounds validation
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

// 🎯 IMPROVED: More lenient accuracy for registration
const ACCURACY_CONFIG = {
  EXCELLENT: 30,    // 0-30m - Perfect for pharmacy location
  GOOD: 80,         // 30-80m - Very good
  ACCEPTABLE: 200,  // 80-200m - Acceptable for pharmacy
  USABLE: 500,      // 200-500m - Still usable, but warn
  MAX: 1000,        // Up to 1km - Last resort
};

// 🎯 IMPROVED: Progressive sampling strategy
const SAMPLE_CONFIG = {
  NETWORK_SAMPLES: 2,      // Quick network positioning samples
  GPS_SAMPLES: 5,          // Accurate GPS samples
  SAMPLE_INTERVAL: 1200,   // 1.2 seconds between readings
  MIN_REQUIRED: 3,         // Minimum valid samples needed
  TIMEOUT_NETWORK: 8000,   // Network timeout
  TIMEOUT_GPS: 20000,      // GPS timeout (generous for registration)
  MAX_RETRIES: 2,
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

function standardDeviation(values, mean) {
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

export function usePharmacyGPSCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [detectionMethod, setDetectionMethod] = useState(null);
  
  const abortControllerRef = useRef(null);

  /**
   * 🎯 Get single GPS reading with progressive accuracy
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
   * 🎯 IMPROVED: Collect samples with progressive enhancement
   */
  const collectSamples = useCallback(async (sampleCount, enableHighAccuracy, onProgress) => {
    const samples = [];
    let retryCount = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < sampleCount; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Location capture cancelled');
      }

      try {
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'collecting',
          samplesCollected: samples.length,
          method: enableHighAccuracy ? 'gps' : 'network',
        });

        const reading = await getSingleReading({
          enableHighAccuracy,
          maximumAge: enableHighAccuracy ? 0 : 5000,
        });

        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Location capture cancelled');
        }

        // Validate Nigeria bounds
        if (!isInNigeria(reading.latitude, reading.longitude)) {
          console.warn(`Sample ${i + 1} outside Nigeria bounds:`, reading);
          
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          consecutiveFailures++;
          if (consecutiveFailures >= 2 && samples.length === 0) {
            throw new Error('Location detected outside Nigeria. Please ensure you are within Nigeria.');
          }
          continue;
        }

        // Check accuracy - be more lenient for registration
        if (reading.accuracy > ACCURACY_CONFIG.MAX) {
          console.warn(`Sample ${i + 1} accuracy too low: ${reading.accuracy}m`);
          
          if (retryCount < SAMPLE_CONFIG.MAX_RETRIES) {
            retryCount++;
            i--;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          // Accept if we have some samples
          if (samples.length > 0) {
            console.log(`Accepting lower accuracy sample (${reading.accuracy}m)`);
            samples.push(reading);
            retryCount = 0;
            consecutiveFailures = 0;
          } else {
            consecutiveFailures++;
            if (consecutiveFailures >= 2) {
              throw new Error('Unable to get accurate location. Please try outdoors.');
            }
          }
          continue;
        }

        // Valid sample
        samples.push(reading);
        retryCount = 0;
        consecutiveFailures = 0;
        
        const quality = getAccuracyQuality(reading.accuracy);
        
        onProgress?.({
          current: i + 1,
          total: sampleCount,
          status: 'success',
          accuracy: reading.accuracy,
          quality,
          samplesCollected: samples.length,
        });

        // Wait between samples
        if (i < sampleCount - 1) {
          await new Promise(resolve => setTimeout(resolve, SAMPLE_CONFIG.SAMPLE_INTERVAL));
        }

      } catch (err) {
        console.error(`Sample ${i + 1} error:`, err);
        
        if (err.message === 'Location capture cancelled') {
          throw err;
        }

        if (err.code === 1) {
          throw new Error('Location permission denied. Please enable location access.');
        }

        consecutiveFailures++;
        
        // If we have enough samples, continue
        if (samples.length >= SAMPLE_CONFIG.MIN_REQUIRED) {
          console.warn(`Sample ${i + 1} failed but continuing with ${samples.length} samples`);
          
          onProgress?.({
            current: i + 1,
            total: sampleCount,
            status: 'error',
            error: err.message,
            samplesCollected: samples.length,
          });
          
          if (i === sampleCount - 1) {
            break;
          }
          continue;
        }

        if (consecutiveFailures >= 2) {
          throw new Error('Unable to capture location. Please try outdoors with clear sky view.');
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

    console.log(`Collected ${samples.length} valid samples out of ${sampleCount} attempts`);
    return samples;
  }, [getSingleReading]);

  /**
   * 🎯 Filter outliers using statistical methods
   */
  const filterOutliers = useCallback((samples) => {
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
    
    return filtered.length >= SAMPLE_CONFIG.MIN_REQUIRED ? filtered : samples;
  }, []);

  /**
   * 🎯 Calculate final location with consistency metrics
   */
  const calculateFinalLocation = useCallback((samples) => {
    if (samples.length === 0) {
      throw new Error('No valid GPS samples collected');
    }

    if (samples.length < SAMPLE_CONFIG.MIN_REQUIRED) {
      throw new Error(`Insufficient readings. Got ${samples.length}, need ${SAMPLE_CONFIG.MIN_REQUIRED}`);
    }

    const latitudes = samples.map(s => s.latitude);
    const longitudes = samples.map(s => s.longitude);
    const accuracies = samples.map(s => s.accuracy);

    const finalLat = median(latitudes);
    const finalLng = median(longitudes);
    const finalAccuracy = median(accuracies);

    // Calculate consistency (spread of readings)
    const distances = samples.map(s => 
      haversineDistance(s.latitude, s.longitude, finalLat, finalLng)
    );
    const maxDistance = Math.max(...distances);

    const quality = getAccuracyQuality(finalAccuracy);

    return {
      latitude: finalLat,
      longitude: finalLng,
      accuracy: Math.round(finalAccuracy),
      quality,
      sampleCount: samples.length,
      consistency: Math.round(maxDistance),
      spread: Math.round(Math.max(...accuracies) - Math.min(...accuracies)),
      timestamp: Date.now(),
    };
  }, []);

  /**
   * 🎯 MAIN: Capture accurate location with progressive fallback
   */
  const captureAccurateLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ 
        current: 0, 
        total: SAMPLE_CONFIG.NETWORK_SAMPLES + SAMPLE_CONFIG.GPS_SAMPLES, 
        status: 'starting',
        phase: 'network'
      });

      if (!navigator.geolocation) {
        throw new Error('GPS not supported by your browser');
      }

      abortControllerRef.current = new AbortController();

      let allSamples = [];
      
      // Phase 1: Quick network positioning
      setProgress(prev => ({ ...prev, status: 'network_phase', phase: 'network' }));
      
      try {
        const networkSamples = await collectSamples(
          SAMPLE_CONFIG.NETWORK_SAMPLES,
          false, // Low accuracy for speed
          (p) => setProgress({ ...p, phase: 'network', total: SAMPLE_CONFIG.NETWORK_SAMPLES + SAMPLE_CONFIG.GPS_SAMPLES })
        );
        
        allSamples.push(...networkSamples);
        
        if (networkSamples.length > 0) {
          setDetectionMethod('network');
          setProgress(prev => ({ 
            ...prev, 
            status: 'network_success',
            samplesCollected: allSamples.length 
          }));
        }
      } catch (err) {
        console.warn('Network positioning failed:', err.message);
        setProgress(prev => ({ 
          ...prev, 
          status: 'network_failed',
          phase: 'gps'
        }));
      }

      // Phase 2: Accurate GPS positioning
      setProgress(prev => ({ 
        ...prev, 
        status: 'gps_phase',
        phase: 'gps'
      }));

      try {
        const gpsSamples = await collectSamples(
          SAMPLE_CONFIG.GPS_SAMPLES,
          true, // High accuracy
          (p) => setProgress({ 
            ...p, 
            phase: 'gps',
            current: SAMPLE_CONFIG.NETWORK_SAMPLES + p.current,
            total: SAMPLE_CONFIG.NETWORK_SAMPLES + SAMPLE_CONFIG.GPS_SAMPLES,
            samplesCollected: allSamples.length + (p.samplesCollected || 0)
          })
        );
        
        allSamples.push(...gpsSamples);
        
        if (gpsSamples.length > 0) {
          setDetectionMethod('gps');
        }
      } catch (err) {
        console.warn('GPS positioning failed:', err.message);
        
        // If we have no samples at all, fail
        if (allSamples.length === 0) {
          throw new Error('Unable to capture location. Please ensure GPS is enabled and try outdoors.');
        }
      }

      if (allSamples.length === 0) {
        throw new Error('No valid GPS readings obtained. Please try outdoors with clear sky view.');
      }

      // Filter outliers
      const filtered = filterOutliers(allSamples);

      // Calculate final location
      const finalLocation = calculateFinalLocation(filtered);

      // Validate final location
      if (!isInNigeria(finalLocation.latitude, finalLocation.longitude)) {
        throw new Error('Calculated location is outside Nigeria. Please ensure you are within Nigeria.');
      }

      setLocation(finalLocation);
      setProgress(null);
      
      return finalLocation;

    } catch (err) {
      if (err.message !== 'Location capture cancelled') {
        console.error('Location capture error:', err);
      }

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw { message: errorMessage, code: err.code };
    } finally {
      setIsCapturing(false);
      abortControllerRef.current = null;
    }
  }, [collectSamples, filterOutliers, calculateFinalLocation]);

  /**
   * 🎯 Quick location (for testing/preview)
   */
  const captureQuickLocation = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setProgress({ current: 1, total: 1, status: 'collecting' });

      const reading = await getSingleReading({
        enableHighAccuracy: false,
        maximumAge: 10000,
      });

      if (!isInNigeria(reading.latitude, reading.longitude)) {
        throw new Error('Location is outside Nigeria');
      }

      const quality = getAccuracyQuality(reading.accuracy);
      const result = {
        latitude: reading.latitude,
        longitude: reading.longitude,
        accuracy: Math.round(reading.accuracy),
        quality,
        sampleCount: 1,
        timestamp: Date.now(),
      };

      setLocation(result);
      setProgress(null);
      return result;

    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw { message: errorMessage, code: err.code };
    } finally {
      setIsCapturing(false);
    }
  }, [getSingleReading]);

  const cancelCapture = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCapturing(false);
      setProgress(null);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setProgress(null);
    setDetectionMethod(null);
  }, []);

  return {
    isCapturing,
    progress,
    location,
    error,
    detectionMethod,
    
    captureAccurateLocation,
    captureQuickLocation,
    cancelCapture,
    clearLocation,
  };
}

function getErrorMessage(error) {
  if (error.code === 1) {
    return 'Location permission denied. Please enable location access in your browser settings.';
  } else if (error.code === 2) {
    return 'Location unavailable. Please check your GPS settings and try outdoors.';
  } else if (error.code === 3) {
    return 'Location request timed out. Please try again outdoors.';
  } else if (error.message) {
    return error.message;
  }
  return 'Failed to capture location';
}

export { ACCURACY_CONFIG, SAMPLE_CONFIG };