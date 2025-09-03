import { useState } from "react";

export function useSearchHistory(key = "searchHistory") {
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(key)) || [];
  });

  const addToHistory = (term) => {
    setHistory((prev) => {
      const newHistory = [term, ...prev.filter((t) => t !== term)];
      localStorage.setItem(key, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(key);
  };

  return { history, addToHistory, clearHistory };
}
