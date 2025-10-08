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

        // 🚦 Skip if aborted (not based on mount)
        if (controller.signal.aborted) {
          console.warn('Search aborted — skipping state update.');
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
        setError(err.message || 'Search failed');
        toast.error(err.message || 'Failed to search medications');
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
