import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const SearchInput = ({
  searchTerm,
  setSearchTerm,
  suggestions,
  setSuggestions,
  isLoadingSuggestions,
  setIsLoadingSuggestions,
  showDropdown = false, // Default to false to prevent undefined error
  setShowDropdown,
  focusedSuggestionIndex,
  setFocusedSuggestionIndex,
  handleSearch,
  handleSelectMedication,
  dropdownRef,
  inputRef,
  suggestionRefs,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && focusedSuggestionIndex === -1 && searchTerm) {
      e.preventDefault();
      handleSearch(searchTerm);
    } else if (!showDropdown || suggestions.length === 0) {
      return;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => {
        const next = Math.min(prev + 1, suggestions.length - 1);
        suggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) inputRef.current?.focus();
        else suggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter' && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectMedication(suggestions[focusedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setFocusedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef, setShowDropdown, setFocusedSuggestionIndex]);

  return (
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardContent className="p-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/70 transition-transform duration-300 group-focus-within:scale-110"
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medications..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(!!e.target.value); // Show dropdown when input has value
            }}
            onKeyDown={handleKeyDown}
            className="pl-12 h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="suggestions-list"
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="suggestions-list"
              className="absolute z-30 w-full mt-3 bg-white/95 backdrop-blur-md border border-gray-100/50 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] max-h-64 overflow-y-auto animate-in slide-in-from-top-5 fade-in-20 duration-300"
              role="listbox"
            >
              {isLoadingSuggestions ? (
                <div className="px-5 py-4 flex items-center text-primary">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-primary"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-base font-medium text-gray-600">Loading...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((med, index) => (
                  <div
                    key={med.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    className={cn(
                      'px-5 py-3 cursor-pointer flex items-center gap-3 text-base font-medium text-gray-900 hover:bg-primary/10 transition-all duration-200',
                      index === focusedSuggestionIndex && 'bg-primary/15 shadow-inner'
                    )}
                    onClick={() => handleSelectMedication(med)}
                    role="option"
                    aria-selected={index === focusedSuggestionIndex}
                  >
                    <Search className="h-4 w-4 text-primary/50" aria-hidden="true" />
                    <span className="truncate">{med.displayName}</span>
                  </div>
                ))
              ) : (
                searchTerm && (
                  <div className="px-5 py-4 text-gray-500 text-base font-medium">
                    No medications found for "{searchTerm}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInput;