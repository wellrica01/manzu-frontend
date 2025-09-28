import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

const AsyncSearchableCombobox = ({
  search,
  value,
  onChange,
  placeholder = "Search...",
  displayKey = "name",
  valueKey = "id",
  disabled = false,
  error = false,
  className = "",
  debounceMs = 300,
  minSearchLength = 2,
  initialOptions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  const searchOptions = useCallback(async (query) => {
    abortControllerRef.current?.abort();
    
    if (query.length < minSearchLength) {
      setOptions(initialOptions);
      setLoading(false);
      return;
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      let results = [];
      if (typeof search === 'function') {
        results = await search(query, abortControllerRef.current.signal);
      } else if (typeof search === 'string') {
        const url = new URL(search, window.location.origin);
        url.searchParams.set('search', query);
        const res = await fetch(url.toString(), { signal: abortControllerRef.current.signal });
        const data = await res.json();
        results = data.data?.activeSubstances || data.data?.medicationIngredients || 
                 data.data?.manufacturers || data.data?.options || [];
      }
      setOptions(results);
      setHighlightedIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [search, minSearchLength, initialOptions]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchOptions(searchTerm), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, searchOptions, debounceMs]);

  const getDisplayText = () => {
    if (!value) return '';
    const selected = options.find(opt => (typeof opt === 'string' ? opt : opt[valueKey]) == value);
    return selected ? (typeof selected === 'string' ? selected : selected[displayKey]) : '';
  };

  const selectOption = (option) => {
    onChange(typeof option === 'string' ? option : option[valueKey]);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        if (options.length) setHighlightedIndex(0);
      }
      return;
    }

    const actions = {
      ArrowDown: () => setHighlightedIndex(prev => prev < options.length - 1 ? prev + 1 : 0),
      ArrowUp: () => setHighlightedIndex(prev => prev > 0 ? prev - 1 : options.length - 1),
      Enter: () => highlightedIndex >= 0 && selectOption(options[highlightedIndex]),
      Escape: () => { setIsOpen(false); setHighlightedIndex(-1); setSearchTerm(''); }
    };

    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`relative flex items-center w-full px-3 py-2 border rounded-lg bg-white cursor-text transition-colors ${
          error ? 'border-red-300 bg-red-50' : 
          isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 
          'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''} ${className}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={isOpen ? searchTerm : getDisplayText()}
          onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 outline-none bg-transparent placeholder-gray-400"
        />
        <div className="flex items-center gap-1 ml-2">
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {value && !disabled && !loading && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onChange(''); setSearchTerm(''); }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && searchTerm.length >= minSearchLength ? (
            <div className="px-3 py-8 text-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-gray-500">
                {searchTerm.length < minSearchLength 
                  ? `Type at least ${minSearchLength} characters to search` 
                  : `No results for "${searchTerm}"`}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {options.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option[valueKey];
                const displayText = typeof option === 'string' ? option : option[displayKey];
                const isSelected = optionValue == value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div 
                    key={optionValue}
                    onClick={() => selectOption(option)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted ? 'bg-blue-50' : 
                      isSelected ? 'bg-green-50' : 
                      'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm truncate ${isSelected ? 'font-medium text-green-700' : 'text-gray-900'}`}>
                      {displayText}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsyncSearchableCombobox;