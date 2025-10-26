// In usePrescriptionData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, sanitizeSearchParams, validateResponse } from '@/lib/apiClient';
import { toast } from 'sonner';

export function usePrescriptionData({
  userIdentifier,
  guestId,
  userLocation,
  filterState,
  filterLga,
  filterWard,
  isLocationProcessed,
}) {
  const [medications, setMedications] = useState([]);
  const [defaultMedications, setDefaultMedications] = useState([]);
  const [prescriptionMetadata, setPrescriptionMetadata] = useState(null);
  const [pharmacyRecommendations, setPharmacyRecommendations] = useState([]);
  const [defaultPharmacyRecommendations, setDefaultPharmacyRecommendations] = useState([]);
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const hasFetchedInitialRef = useRef(false); // Track initial fetch

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchPrescriptionData = useCallback(async () => {
    if (!userIdentifier || !guestId) return;

    try {
      // Sanitize and build query params
      const params = sanitizeSearchParams({
        lat: isLocationProcessed && userLocation ? userLocation.lat : undefined,
        lng: isLocationProcessed && userLocation ? userLocation.lng : undefined,
        radius: isLocationProcessed && userLocation ? '10' : undefined,
        state: filterState || undefined,
        lga: filterLga || undefined,
        ward: filterWard || undefined,
      });

      const queryString = new URLSearchParams(params).toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/${userIdentifier}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching with URL:', url);

      // Create unique request key for deduplication
      const requestKey = `prescription-${userIdentifier}-${queryString}`;
      
      // Abort previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const data = await apiRequest(requestKey, url, {
        headers: { 'x-guest-id': guestId },
        signal: abortControllerRef.current.signal,
      });

      // Validate response structure
      const validated = validateResponse(data, {
        medications: true,
        pharmacyRecommendations: true,
      });

      if (!isMountedRef.current) return;

      setMedications(validated.medications || []);
      setPrescriptionMetadata(validated.prescriptionMetadata || null);
      setPharmacyRecommendations(validated.pharmacyRecommendations || []);

      // Store defaults when no filters applied
      const hasFilters = filterState || filterLga || filterWard;
      if (!hasFilters) {
        setDefaultMedications(validated.medications || []);
        setDefaultPharmacyRecommendations(validated.pharmacyRecommendations || []);
      }

      setError(null);
      hasFetchedInitialRef.current = true; // Mark initial fetch complete
    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Fetch prescription error:', err);

      if (!isMountedRef.current) return;

      const errorMessage = err.message || 'Failed to load prescription';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userIdentifier, guestId, userLocation, filterState, filterLga, filterWard, isLocationProcessed]);

  useEffect(() => {
    console.log('usePrescriptionData useEffect:', {
      userIdentifier,
      guestId,
      userLocation,
      isLocationProcessed,
      filterState,
      filterLga,
      filterWard,
      hasFetchedInitial: hasFetchedInitialRef.current,
    });
    if (userIdentifier && guestId && !hasFetchedInitialRef.current) {
      setLoading(true);
      fetchPrescriptionData();
    }
  }, [userIdentifier, guestId, filterLga, filterState, filterWard, isLocationProcessed, userLocation, fetchPrescriptionData]);

  return {
    medications,
    defaultMedications,
    prescriptionMetadata,
    pharmacyRecommendations,
    defaultPharmacyRecommendations,
    loading,
    error,
    refetch: fetchPrescriptionData,
  };
}