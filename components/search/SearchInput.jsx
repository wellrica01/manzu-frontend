import { useEffect, useState, } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic } from 'lucide-react';
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
  searchHistory,
  setSearchHistory,
  showHistory,
  setShowHistory,
}) => {
  const [isListening, setIsListening] = useState(false);

  // Voice search functionality
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      setShowHistory(false);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && focusedSuggestionIndex === -1 && searchTerm) {
      e.preventDefault();
      if (searchTerm.trim()) {
        const newHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
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
      const suggestion = suggestions[focusedSuggestionIndex];
      const newHistory = [suggestion.displayName, ...searchHistory.filter(item => item !== suggestion.displayName)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      handleSelectMedication(suggestion);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowHistory(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  const handleInputFocus = () => {
    if (searchHistory.length > 0 && !searchTerm) {
      setShowHistory(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(!!value);
    setShowHistory(false);
  };

  const handleHistoryClick = (term) => {
    setSearchTerm(term);
    setShowHistory(false);
    if (term.trim()) {
      const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    handleSearch(term);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowHistory(false);
        setFocusedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef, setShowDropdown, setFocusedSuggestionIndex]);

  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#225F91]/70"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search for medications..."
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        className="pl-10 pr-16 h-12 text-sm sm:text-base font-medium rounded-sm border border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300 w-full"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showDropdown || showHistory}
        aria-controls="suggestions-list"
      />
    <Button
      variant="ghost"
      size="lg"
      onClick={startVoiceSearch}
      disabled={isListening}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#1ABA7F] hover:bg-[#20BD5A] text-white p-0 border-0 transition-all duration-200",
        isListening 
          ? "scale-120 animate-pulse shadow-lg shadow-[#1ABA7F]/50" 
          : "hover:scale-105 active:scale-95"
      )}
      aria-label="Voice search"
    >
      <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
    </Button>
    </div>
  );
};

export default SearchInput;