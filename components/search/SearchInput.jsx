import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, Sparkles } from 'lucide-react';
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
  handleSelectMedication, // now always passes {id, displayName}
  dropdownRef,
  inputRef,
  suggestionRefs,
  searchHistory,
  setSearchHistory,
  showHistory,
  setShowHistory,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // --- Voice Search ---
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

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // --- Handle Key Down ---
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
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
      addToHistoryAndSelect(suggestion);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowHistory(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  // --- Add to history and select ---
  const addToHistoryAndSelect = (suggestion) => {
    const newHistory = [
      suggestion,
      ...searchHistory.filter((item) => item.id !== suggestion.id),
    ].slice(0, 5);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    setSearchTerm(suggestion.displayName);
    setShowDropdown(false);
    handleSelectMedication(suggestion); // Pass object with ID
  };

  // --- Handle Suggestion Click ---
  const onSuggestionClick = (suggestion) => {
    addToHistoryAndSelect(suggestion);
  };

  // --- Input Handlers ---
  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchHistory.length > 0) setShowHistory(true);
  };
  const handleInputBlur = () => setIsFocused(false);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(!!value);
    setShowHistory(false);
  };

  // --- Click Outside ---
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
  }, [dropdownRef, setShowDropdown, setFocusedSuggestionIndex, setShowHistory]);

  return (
    <div className="relative w-full group">
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] opacity-0 transition-opacity duration-500 blur-sm",
        isFocused && "opacity-30 animate-gradient bg-300%"
      )} />
      
      <div className="relative">
        <Search
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300",
            isFocused ? "text-[#1ABA7F] scale-110" : "text-[#225F91]/70"
          )}
          aria-hidden="true"
        />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for any medication..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={cn(
            "pl-12 pr-24 h-14 text-base font-medium rounded-2xl border-2 bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-300 w-full shadow-lg",
            isFocused 
              ? "border-[#1ABA7F] shadow-[0_0_20px_rgba(26,186,127,0.2)]" 
              : "border-gray-200 hover:border-[#1ABA7F]/50"
          )}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown || showHistory}
          aria-controls="suggestions-list"
        />

        <Sparkles className={cn(
          "absolute left-[calc(100%-4.5rem)] top-1/2 -translate-y-1/2 h-4 w-4 text-[#1ABA7F] animate-pulse",
          !searchTerm && "hidden"
        )} aria-hidden="true" />

        <Button
          variant="ghost"
          size="lg"
          onClick={startVoiceSearch}
          disabled={isListening}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white p-0 border-0 transition-all duration-300 shadow-lg",
            isListening 
              ? "scale-110 animate-pulse shadow-[0_0_20px_rgba(26,186,127,0.6)]" 
              : "hover:scale-105 active:scale-95 hover:shadow-xl"
          )}
          aria-label="Voice search"
        >
          <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
        </Button>
      </div>
    </div>
  );
};

export default SearchInput;
