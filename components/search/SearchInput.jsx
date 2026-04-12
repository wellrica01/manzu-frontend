import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ==================== SEARCH INPUT COMPONENT ==================== */
const SearchInput = ({
  searchTerm,
  setSearchTerm,
  suggestions,
  isLoadingSuggestions,
  showDropdown,
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

  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search not supported in this browser');
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
          suggestionRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) inputRef.current?.focus();
        else {
          setTimeout(() => {
            suggestionRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 0);
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0) {
        const suggestion = suggestions[focusedSuggestionIndex];
        handleSelectMedication(suggestion);
      }
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowHistory(false);
      setFocusedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  }, [showDropdown, suggestions, focusedSuggestionIndex, setFocusedSuggestionIndex, inputRef, suggestionRefs, setShowDropdown, setShowHistory, handleSelectMedication]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (searchHistory.length > 0 && !searchTerm) {
      setShowDropdown(false);
      setTimeout(() => setShowHistory(true), 100);
    } else if (searchTerm) {
      setShowDropdown(true);
      setShowHistory(false);
    }
  }, [searchHistory.length, searchTerm, setShowHistory, setShowDropdown]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(!!value);
    setShowHistory(false);
  }, [setSearchTerm, setShowDropdown, setShowHistory]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setShowDropdown(false);
    setShowHistory(searchHistory.length > 0);
    inputRef.current?.focus();
  }, [setSearchTerm, setShowDropdown, setShowHistory, searchHistory.length, inputRef]);

  return (
<div className="relative w-full group">
  {/* Premium glow effect */}
  <div className={cn(
    "absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-700 blur-xl",
    isFocused ? "opacity-30 animate-gradient bg-300%" : "opacity-0"
  )} />

  <div className="relative">

    {/* Main input */}
    <Input
      ref={inputRef}
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      className={cn(
        "pl-4 pr-28 sm:pr-32 h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-xl border-2 bg-white placeholder:text-gray-500 transition-all duration-500 shadow-xl",
        isFocused 
          ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/10" 
          : "border-gray-200 hover:border-gray-300 hover:shadow-2xl"
      )}
      autoComplete="off"
    />

    {/* Sparkles indicator */}
    {searchTerm && (
      <Sparkles
        className={cn(
          "absolute right-20 sm:right-24 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-amber-500 transition-all duration-500 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        )}
      />
    )}

    {/* Clear button */}
    {searchTerm && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearSearch}
        className="absolute right-12 sm:right-16 top-1/2 -translate-y-1/2 h-9 sm:h-10 w-9 sm:w-10 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 p-0 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <X className="h-4 sm:h-5 w-4 sm:w-5" strokeWidth={2.5} />
      </Button>
    )}

    {/* Voice button */}
    <Button
      variant="ghost"
      size="lg"
      onClick={startVoiceSearch}
      disabled={isListening}
      className={cn(
        "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-10 sm:h-12 w-10 sm:w-12 rounded-xl p-0 transition-all duration-500 shadow-lg",
        isListening 
          ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white scale-110 animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.6)]"
          : "bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white hover:scale-110 active:scale-95"
      )}
    >
      <Mic className={cn(
        "h-5 sm:h-6 w-5 sm:w-6 transition-transform duration-300",
        isListening && "animate-pulse scale-125"
      )} strokeWidth={2.5} />
    </Button>
  </div>

  {/* Voice feedback */}
  {isListening && (
    <div className="relative left-0 right-0 top-full mt-2 mb-2 sm:mt-3 p-3 sm:p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-2 border-rose-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative w-2.5 h-2.5 sm:w-3 sm:h-3">
          <div className="w-full h-full rounded-full bg-rose-500 animate-ping absolute" />
          <div className="w-full h-full rounded-full bg-rose-500" />
        </div>
        <span className="text-rose-700 font-bold text-xs sm:text-sm">Listening... Speak now</span>
      </div>
    </div>
  )}

  <style jsx global>{`
    @keyframes gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animate-gradient {
      animation: gradient 3s ease infinite;
    }
    .bg-300\\% {
      background-size: 300% 300%;
    }
  `}</style>
</div>

  );
};

export default SearchInput;