import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, Sparkles, X } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Smooth keyboard detection
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardVisible = viewportHeight < windowHeight * 0.75;
        setIsKeyboardVisible(keyboardVisible);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    }
  }, []);

  // Smooth scroll when keyboard appears
  useEffect(() => {
    if (isKeyboardVisible && (showDropdown || showHistory) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 150);
    }
  }, [isKeyboardVisible, showDropdown, showHistory, inputRef]);

  // Enhanced voice search with feedback
  const startVoiceSearch = useCallback(() => {
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
      setShowDropdown(true);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }, [setSearchTerm, setShowHistory, setShowDropdown]);

  // Smooth keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => {
        const next = Math.min(prev + 1, suggestions.length - 1);
        setTimeout(() => {
          suggestionRefs.current[next]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 0);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) {
          inputRef.current?.focus();
        } else {
          setTimeout(() => {
            suggestionRefs.current[next]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }, 0);
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0) {
        const suggestion = suggestions[focusedSuggestionIndex];
        addToHistoryAndSelect(suggestion);
      }
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowHistory(false);
      setFocusedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  }, [showDropdown, suggestions, focusedSuggestionIndex, setFocusedSuggestionIndex, inputRef, suggestionRefs, setShowDropdown, setShowHistory]);

  // Add to history with smooth transition
  const addToHistoryAndSelect = useCallback((suggestion) => {
    const newHistory = [
      suggestion,
      ...searchHistory.filter((item) => item.id !== suggestion.id),
    ].slice(0, 5);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    setSearchTerm(suggestion.displayName);
    
    // Smooth close animation
    setTimeout(() => {
      setShowDropdown(false);
      setShowHistory(false);
    }, 100);
    
    handleSelectMedication(suggestion);
  }, [searchHistory, setSearchHistory, setSearchTerm, setShowDropdown, setShowHistory, handleSelectMedication]);

  // Input handlers with smooth transitions
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (searchHistory.length > 0 && !searchTerm) {
      setTimeout(() => setShowHistory(true), 100);
    }
  }, [searchHistory.length, searchTerm, setShowHistory]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(!!value);
    setShowHistory(false);
  }, [setSearchTerm, setShowDropdown, setShowHistory]);

  // Clear search with animation
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setShowDropdown(false);
    setShowHistory(searchHistory.length > 0);
    inputRef.current?.focus();
  }, [setSearchTerm, setShowDropdown, setShowHistory, searchHistory.length, inputRef]);

  return (
    <div className="relative w-full group">
      {/* Animated glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] transition-all duration-500 blur-sm",
        isFocused ? "opacity-30 animate-gradient bg-300%" : "opacity-0"
      )} />
      
      <div className="relative">
        {/* Search icon with smooth animation */}
        <Search
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 pointer-events-none",
            isFocused ? "text-[#1ABA7F] scale-110" : "text-[#225F91]/70"
          )}
          aria-hidden="true"
        />
        
        {/* Main input */}
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
            "pl-12 pr-32 h-14 text-base sm:text-lg font-bold rounded-2xl border-2 bg-white text-gray-600 placeholder:text-gray-400 transition-all duration-300 w-full shadow-lg",
            isFocused 
              ? "border-[#1ABA7F] shadow-[0_0_20px_rgba(26,186,127,0.2)] focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2" 
              : "border-gray-200 hover:border-[#1ABA7F]/50"
          )}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown || showHistory}
          aria-controls="suggestions-list"
        />

        {/* Sparkles animation */}
        <Sparkles 
          className={cn(
            "absolute right-20 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1ABA7F] transition-all duration-300",
            searchTerm ? "opacity-100 animate-pulse scale-100" : "opacity-0 scale-0"
          )} 
          aria-hidden="true" 
        />

        {/* Clear button */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className={cn(
              "absolute right-14 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 p-0 border-0 transition-all duration-200",
              "animate-in fade-in zoom-in-50 duration-200"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Voice search button with pulse animation */}
        <Button
          variant="ghost"
          size="lg"
          onClick={startVoiceSearch}
          disabled={isListening}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white p-0 border-0 transition-all duration-300 shadow-lg",
            isListening 
              ? "scale-110 animate-pulse shadow-[0_0_25px_rgba(26,186,127,0.7)]" 
              : "hover:scale-105 active:scale-95 hover:shadow-xl"
          )}
          aria-label="Voice search"
        >
          <Mic className={cn(
            "h-5 w-5 transition-transform duration-300",
            isListening && "animate-pulse scale-110"
          )} />
        </Button>
      </div>

      {/* Voice search feedback */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-[#1ABA7F]/10 border border-[#1ABA7F]/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-[#1ABA7F] text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-[#1ABA7F] animate-pulse" />
            Listening...
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;