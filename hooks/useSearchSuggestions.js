import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { fetchSuggestions } from '../lib/searchApi';

export function useSearchSuggestions(apiUrl) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchSuggestionsInternal = useCallback(async (query) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setShowDropdown(false);
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const results = await fetchSuggestions(query, apiUrl);
      setSuggestions(results || []);
      setShowDropdown(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Suggestions error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiUrl]);

  // Debounce the fetch
  const debouncedFetch = useDebounce(fetchSuggestionsInternal, 300);

  return {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    fetchSuggestions: debouncedFetch,
    clearSuggestions: () => setSuggestions([]),
  };
}