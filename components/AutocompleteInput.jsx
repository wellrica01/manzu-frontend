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
  showClearButton = true  // New prop to control clear button visibility
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
    if (typeof value === "string") setInputText(value);
    else if (value?.name) setInputText(value.name);
    else setInputText("");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current.contains(e.target)) setShowOptions(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setHighlightedIndex(-1);

    if (allowCustomInput && onCustomInput) onCustomInput(text);

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

        let items = [];
        if (res?.data?.result?.manufacturers) items = res.data.result.manufacturers;
        else if (res?.data?.result?.activeSubstances) items = res.data.result.activeSubstances;
        else if (res?.data?.result?.medicationIngredients) items = res.data.result.medicationIngredients;
        else if (res?.data?.result?.medications) items = res.data.result.medications;

        setOptions(items);
        setShowOptions(true);
      } catch (err) {
        console.error(err);
        setOptions([]);
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
  };

  const handleSelect = (option) => {
    setInputText(displayFn ? displayFn(option) : option.name);
    onChange(option);
    setShowOptions(false);
  };

  const handleKeyDown = (e) => {
    if (!showOptions) return;

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
    return option.name;
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
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
            error ? "border-red-300 bg-red-50" : "border-gray-300"
          }`}
        />
        {/* Clear Button */}
        {showClearButton && inputText && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear"
            tabIndex={-1}
          >
            <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>
      {showOptions && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-md">
          {options.length > 0 ? (
            options.map((option, idx) => (
              <li
                key={option.id ?? option.name ?? idx}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 cursor-pointer ${
                  highlightedIndex === idx ? "bg-[#1ABA7F]/20" : "hover:bg-[#1ABA7F]/10"
                }`}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {renderText(option)}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">No results found</li>
          )}
        </ul>
      )}
      {loading && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
    </div>
  );
}