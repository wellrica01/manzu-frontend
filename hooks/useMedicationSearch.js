import { useState, useCallback, useRef, useEffect } from 'react';
import { searchMedications } from '../lib/searchApi';
import { toast } from 'sonner';

export function useMedicationSearch(apiUrl) {
  const [results, setResults] = useState([]);
  const [defaultResults, setDefaultResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // 🧠 Debug watcher
  useEffect(() => {
    console.log('isSearching:', isSearching, 'results:', results.length);
  }, [isSearching, results]);

  // 🔄 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const search = useCallback(
    async (params) => {
      if (!params.medicationId) {
        console.error('Medication ID required');
        toast.error('Please select a medication to search');
        return;
      }

      // 🛑 Abort previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearching(true);
      setError(null);

      const startTime = Date.now();

      try {
        const data = await searchMedications(params, apiUrl);

        // Ensure minimum visible loading time (UX)
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
        }

        // 🚦 Skip if aborted
        if (controller.signal.aborted) {
          console.warn('Search aborted – skipping state update.');
          return;
        }

        console.log('✅ Hook received data:', data);

        const cleanResults = Array.isArray(data) ? data : [];
        setResults(cleanResults);

        // Cache default results if no filters used
        if (
          !params.filters?.state &&
          !params.filters?.lga &&
          !params.filters?.ward
        ) {
          setDefaultResults(cleanResults);
        }

        setError(null);
            
        return cleanResults;
      } catch (err) {
        if (err.name === 'AbortError') return; // ignore canceled calls

        console.error('Search error:', err);

        setResults([]);
        
        // 🎯 Better error messaging
        let errorMessage = 'Failed to search medications';
        
        if (err.message) {
          errorMessage = err.message;
        }
        
        // Specific error cases
        if (err.message?.includes('Coordinates must be within Nigeria')) {
          errorMessage = 'Your location is outside Nigeria. Please filter by State/LGA to search.';
        } else if (err.message?.includes('Invalid')) {
          errorMessage = `Invalid search: ${err.message}`;
        } else if (err.status === 404) {
          errorMessage = 'No results found. Try adjusting your filters.';
        } else if (err.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (err.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        setError(errorMessage);
        
        // Show user-friendly toast
        toast.error(errorMessage, {
          duration: 5000,
          description: err.status ? `Error code: ${err.status}` : undefined,
        });
      } finally {
        // ⚙️ Always stop the loading spinner
        setIsSearching(false);
      }
    },
    [apiUrl]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const restoreDefaults = useCallback(() => {
    setResults(defaultResults);
    setError(null);
  }, [defaultResults]);

  return {
    results,
    defaultResults,
    isSearching,
    error,
    search,
    clearResults,
    restoreDefaults,
  };
}