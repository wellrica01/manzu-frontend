// hooks/usePharmacyRegistration.js
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function usePharmacyRegistration() {
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const captureGPSLocation = useCallback(async () => {
    setIsCapturingLocation(true);
    setLocationError(null);

    try {
      // Request high-accuracy GPS
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0, // Force fresh reading
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy), // meters
        timestamp: new Date().toISOString(),
      };

      // Validate coordinates are in Nigeria
      if (location.latitude < 4 || location.latitude > 14 || 
          location.longitude < 3 || location.longitude > 15) {
        throw new Error('Location is outside Nigeria. Please ensure you are at the pharmacy location.');
      }

      // Warn if accuracy is poor
      if (location.accuracy > 100) {
        toast.warning(`GPS accuracy is ${location.accuracy}m. For best results, move outdoors.`);
      } else if (location.accuracy < 20) {
        toast.success(`Excellent GPS accuracy: ${location.accuracy}m`);
      }

      setGpsLocation(location);
      return location;

    } catch (error) {
      let errorMessage = 'Failed to capture location';
      
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your device settings.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setLocationError(errorMessage);
      toast.error(errorMessage);
      throw error;

    } finally {
      setIsCapturingLocation(false);
    }
  }, []);

  const clearGPSLocation = useCallback(() => {
    setGpsLocation(null);
    setLocationError(null);
  }, []);

  return {
    gpsLocation,
    isCapturingLocation,
    locationError,
    captureGPSLocation,
    clearGPSLocation,
  };
}