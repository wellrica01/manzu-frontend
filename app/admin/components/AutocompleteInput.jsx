"use client";

import { useState, useEffect, useRef } from "react";

export function AutocompleteInput({
  label,
  value,             // object or string
  onChange,          // function to update parent form
  fetchOptions,      // API function
  placeholder = "",
  error,
  displayFn,         // optional: function to render option text
  minChars = 1       // minimum characters before search
}) {
  const [inputText, setInputText] = useState(
    typeof value === "string" ? value : value?.name || ""
  );
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const containerRef = useRef();
  const debounceTimeout = useRef(null);

  // Keep inputText in sync when value changes
  useEffect(() => {
    if (typeof value === "string") {
      setInputText(value);
    } else if (value?.name) {
      setInputText(value.name);
    } else {
      setInputText(""); // ensures controlled input
    }
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

    clearTimeout(debounceTimeout.current);

    if (!text || text.length < minChars) {
      setOptions([]);
      setShowOptions(false);
      onChange(null); // optional: clear selection if below minChars
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchOptions(text, 20);

        let items = [];
        if (res?.data?.result?.manufacturers) {
          items = res.data.result.manufacturers;
        } else if (res?.data?.result?.activeSubstances) {
          items = res.data.result.activeSubstances;
        } else if (res?.data?.result?.medicationIngredients) {
          items = res.data.result.medicationIngredients;
        }

        setOptions(items);
        setShowOptions(true);
      } catch (err) {
        console.error(err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce 300ms
  };

  const handleSelect = (option) => {
    setInputText(displayFn ? displayFn(option) : option.name);
    onChange(option);
    setShowOptions(false);
  };

  const renderText = (option) => {
    if (displayFn) return displayFn(option);

    // Default for medicationIngredients: ActiveSubstance + Strength
    if (option.ActiveSubstance) {
      return `${option.ActiveSubstance.name}${option.strengthValue ? ` - ${option.strengthValue}${option.strengthUnit || ''}` : ''}`;
    }
    return option.name;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-900">{label}</label>}
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
          error ? "border-red-300 bg-red-50" : "border-gray-300"
        }`}
      />
      {showOptions && options.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-md">
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-[#1ABA7F]/10 cursor-pointer"
            >
              {renderText(option)}
            </li>
          ))}
        </ul>
      )}
      {loading && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
    </div>
  );
}
