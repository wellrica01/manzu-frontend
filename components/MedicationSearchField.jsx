import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MedicationSearchField({ value, onSelect, placeholder = 'Search medication...' }) {
  const [searchTerm, setSearchTerm] = useState(value?.displayName || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  useEffect(() => {
    setSearchTerm(value?.displayName || '');
  }, [value]);

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const debounce = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 250);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line
  }, [searchTerm]);

  const fetchSuggestions = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/medication-suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
      setShowDropdown(true);
      setFocusedIndex(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(!!e.target.value);
  };

  const handleSelect = (med) => {
    setSearchTerm(med.displayName);
    setShowDropdown(false);
    setFocusedIndex(-1);
    onSelect(med);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.min(prev + 1, suggestions.length - 1);
        suggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        suggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(!!searchTerm)}
        onKeyDown={handleKeyDown}
        className="pr-10"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="med-suggestions-list"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#1ABA7F]" />
      )}
      {showDropdown && suggestions.length > 0 && (
        <Card className="absolute z-50 left-0 right-0 mt-1 border border-[#1ABA7F]/20 bg-white/95 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            <ul id="med-suggestions-list">
              {suggestions.map((med, idx) => (
                <li
                  key={med.id}
                  ref={el => (suggestionRefs.current[idx] = el)}
                  className={cn(
                    'px-4 py-2 cursor-pointer flex items-center gap-2',
                    focusedIndex === idx ? 'bg-[#1ABA7F]/10 text-[#225F91]' : 'hover:bg-[#1ABA7F]/10 text-gray-700'
                  )}
                  onMouseDown={() => handleSelect(med)}
                  aria-selected={focusedIndex === idx}
                  role="option"
                >
                  <TrendingUp className="h-4 w-4 text-[#225F91]" />
                  <span>{med.displayName}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 