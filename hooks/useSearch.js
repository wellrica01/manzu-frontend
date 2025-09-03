import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useApi";

export function useSearch({ userLocation, filters, t }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);

  // fetch suggestions with debounce
  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => fetchSuggestions(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSuggestions = async (query) => {
    try {
      setIsLoadingSuggestions(true);
      const data = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/medication-suggestions?q=${encodeURIComponent(query)}`
      );
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = useCallback(
    async (term) => {
      try {
        setError(null);
        setIsSearching(true);

        const params = new URLSearchParams({ q: term });
        if (userLocation) {
          params.append("lat", userLocation.lat);
          params.append("lng", userLocation.lng);
          params.append("radius", "10");
        }
        if (filters.state) params.append("state", filters.state);
        if (filters.lga) params.append("lga", filters.lga);
        if (filters.ward) params.append("ward", filters.ward);
        params.append("sortBy", filters.sortBy);

        const data = await apiFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/search?${params}`
        );
        setResults(data);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [userLocation, filters]
  );

  return {
    searchTerm,
    setSearchTerm,
    results,
    suggestions,
    error,
    isSearching,
    isLoadingSuggestions,
    handleSearch,
  };
}
