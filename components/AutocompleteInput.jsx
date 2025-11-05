"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export function AutocompleteInput({
  label,
  value,             
  onChange,          
  fetchOptions,      
  placeholder = "",
  error,
  displayFn,         
  minChars = 1,      
  allowCustomInput = false, 
  onCustomInput = null,
  showClearButton = true
}) {
  const [inputText, setInputText] = useState(
    typeof value === "string" ? value : value?.name || ""
  );
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef();
  const debounceTimeout = useRef(null);

  // Sync with parent value
  useEffect(() => {
    if (typeof value === "string") {
      setInputText(value);
    } else if (value) {
      setInputText(displayFn ? displayFn(value) : value.name || "");
    } else {
      setInputText("");
    }
  }, [value, displayFn]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setHighlightedIndex(-1);

    if (allowCustomInput && onCustomInput) {
      onCustomInput(text);
    }

    clearTimeout(debounceTimeout.current);

    if (!text || text.length < minChars) {
      setOptions([]);
      setShowOptions(false);
      if (!allowCustomInput) onChange(null);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchOptions(text, 20);
        
        // Fixed: Access the correct response structure
        let items = [];
        if (res?.data?.manufacturers) {
          items = res.data.manufacturers;
        } else if (res?.data?.activeSubstances) {
          items = res.data.activeSubstances;
        } else if (res?.data?.medicationIngredients) {
          items = res.data.medicationIngredients;
        } else if (res?.data?.medications) {
          items = res.data.medications;
        }

        console.log('Fetched options:', items); // Debug log
        setOptions(items);
        setShowOptions(items.length > 0);
      } catch (err) {
        console.error('Fetch error:', err);
        setOptions([]);
        setShowOptions(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleClear = () => {
    setInputText("");
    onChange(null);
    setOptions([]);
    setShowOptions(false);
    if (allowCustomInput && onCustomInput) {
      onCustomInput("");
    }
  };

  const handleSelect = (option) => {
    const displayText = displayFn ? displayFn(option) : option.name;
    setInputText(displayText);
    onChange(option);
    setShowOptions(false);
  };

  const handleKeyDown = (e) => {
    if (!showOptions || options.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        handleSelect(options[highlightedIndex]);
      } else if (allowCustomInput && inputText) {
        onCustomInput && onCustomInput(inputText);
        setShowOptions(false);
      }
    } else if (e.key === "Escape") {
      setShowOptions(false);
    }
  };

  const renderText = (option) => {
    if (displayFn) return displayFn(option);
    if (option.ActiveSubstance) {
      return `${option.ActiveSubstance.name}${option.strengthValue ? ` - ${option.strengthValue}${option.strengthUnit || ''}` : ''}`;
    }
    return option.name || 'Unnamed';
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (options.length > 0) setShowOptions(true);
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
            error ? "border-red-300 bg-red-50" : "border-gray-300"
          }`}
        />
        {/* Clear Button */}
        {showClearButton && inputText && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear"
            tabIndex={-1}
          >
            <X className="w-4 h-4 text-red-500 hover:text-red-700" strokeWidth={3}/>
          </button>
        )}
      </div>
      
      {/* Dropdown */}
      {showOptions && options.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
          {options.map((option, idx) => (
            <li
              key={option.id ?? idx}
              onClick={() => handleSelect(option)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                highlightedIndex === idx ? "bg-[#1ABA7F]/20" : "hover:bg-[#1ABA7F]/10"
              }`}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {renderText(option)}
            </li>
          ))}
        </ul>
      )}
      
      {/* Loading state */}
      {loading && (
        <p className="text-xs text-gray-500 mt-1">Searching...</p>
      )}
      
      {/* No results */}
      {showOptions && !loading && options.length === 0 && inputText.length >= minChars && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}