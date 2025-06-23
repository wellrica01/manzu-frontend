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
  showDropdown = false,
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
      className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      <CardContent className="p-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#225F91]/70"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medications..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(!!e.target.value);
            }}
            onKeyDown={handleKeyDown}
            className="pl-12 h-12 text-base font-medium rounded-xl border border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="suggestions-list"
          />
          {showDropdown && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 z-10 bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-xl max-h-60 overflow-y-auto"
              id="suggestions-list"
              role="listbox"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  ref={(el) => (suggestionRefs.current[index] = el)}
                  onClick={() => handleSelectMedication(suggestion)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSelectMedication(suggestion);
                    }
                  }}
                  className={cn(
                    'px-4 py-3 text-base font-medium text-gray-900 cursor-pointer hover:bg-[#1ABA7F]/10 transition-colors duration-200',
                    focusedSuggestionIndex === index ? 'bg-[#225F91]/10 text-[#225F91]' : ''
                  )}
                  role="option"
                  aria-selected={focusedSuggestionIndex === index}
                  tabIndex={-1}
                >
                  {suggestion.displayName}
                  {suggestion.genericName && (
                    <span className="block text-sm text-gray-500">
                      {suggestion.genericName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {isLoadingSuggestions && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-xl p-4"
            >
              <p className="text-gray-600 text-base font-medium">Loading...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInput;