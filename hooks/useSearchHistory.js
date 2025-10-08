import { useState, useCallback, useEffect } from 'react';
import { loadSearchHistory, saveSearchHistory, clearSearchHistory as clearHistory } from '../lib/searchApi';
import { useDebounce } from './useDebounce';

const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load on mount
  useEffect(() => {
    const loaded = loadSearchHistory();
    setHistory(loaded);
  }, []);

  // Debounced save
  const debouncedSave = useDebounce((newHistory) => {
    saveSearchHistory(newHistory);
  }, 1000);

  const addToHistory = useCallback((item) => {
    if (!item || !item.id || !item.displayName) {
      console.error('Invalid history item');
      return;
    }

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(h => h.id !== item.id);
      // Add to front
      const newHistory = [item, ...filtered].slice(0, MAX_HISTORY);
      // Save debounced
      debouncedSave(newHistory);
      return newHistory;
    });
  }, [debouncedSave]);

  const removeFromHistory = useCallback((itemId) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== itemId);
      saveSearchHistory(newHistory); // Immediate save for deletions
      return newHistory;
    });
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    clearHistory();
  }, []);

  return {
    history,
    showHistory,
    setShowHistory,
    addToHistory,
    removeFromHistory,
    clearAll,
  };
}