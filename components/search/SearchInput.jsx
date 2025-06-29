import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Pill, Microscope } from 'lucide-react';
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
  handleSelectService,
  dropdownRef,
  inputRef,
  suggestionRefs,
  serviceType,
}) => {
  const placeholder = {
    medication: 'Search for medications...',
    diagnostic: 'Search for tests...',
    diagnostic_package: 'Search for packages...',
  }[serviceType] || 'Search for services...';

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
      handleSelectService(suggestions[focusedSuggestionIndex]);
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
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardContent className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#225F91]/70 group-focus-within:scale-110 transition-transform duration-300" aria-hidden="true" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(!!e.target.value);
            }}
            onKeyDown={handleKeyDown}
            className="pl-12 h-12 text-base font-medium rounded-2xl border border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="suggestions-list"
            aria-expanded={showDropdown}
            aria-activedescendant={focusedSuggestionIndex >= 0 ? `suggestion-${focusedSuggestionIndex}` : undefined}
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="suggestions-list"
              className="absolute z-30 w-full max-w-full mt-3 bg-white/95 backdrop-blur-lg border border-[#1ABA7F]/20 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] max-h-64 overflow-y-auto animate-in slide-in-from-top duration-300"
              role="listbox"
            >
              {isLoadingSuggestions ? (
                <div className="px-5 py-4 flex items-center text-[#225F91]">
                  <Loader2 className="animate-spin h-5 w-5 mr-3 text-[#225F91]" aria-hidden="true" />
                  <span className="text-base font-medium text-gray-600">Loading...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((service, index) => (
                  <div
                    key={service.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    id={`suggestion-${index}`}
                    className={cn(
                      'px-5 py-3 cursor-pointer flex items-center gap-3 text-base font-medium text-gray-900 hover:bg-[#1ABA7F]/10 transition-all duration-200',
                      index === focusedSuggestionIndex && 'bg-[#1ABA7F]/15 shadow-inner'
                    )}
                    onClick={() => handleSelectService(service)}
                    role="option"
                    aria-selected={index === focusedSuggestionIndex}
                  >
                    {serviceType === 'medication' ? (
                      <Pill className="h-4 w-4 text-[#225F91]/50" aria-hidden="true" />
                    ) : (
                      <Microscope className="h-4 w-4 text-[#225F91]/50" aria-hidden="true" />
                    )}
                    <div>
                      <span className="truncate">{service.displayName}</span>
                      {serviceType === 'medication' && service.genericName && (
                        <span className="block text-sm text-gray-500">{service.genericName}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                searchTerm && (
                  <div className="px-5 py-4 text-gray-500 text-base font-medium">
                    No {serviceType === 'medication' ? 'medications' : serviceType === 'diagnostic' ? 'tests' : 'packages'} found for "{searchTerm}"
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