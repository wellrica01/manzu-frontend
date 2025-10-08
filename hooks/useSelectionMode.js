import { useState, useCallback } from "react";


export function useSelectionMode() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  const toggleSelect = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback((itemIds) => {
    setSelectedItems(new Set(itemIds));
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);
  
  return {
    selectionMode,
    setSelectionMode,
    selectedItems,
    toggleSelect,
    selectAll,
    clearSelection,
  };
}