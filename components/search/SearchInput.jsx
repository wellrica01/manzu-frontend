import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Mic, History, TrendingUp, X } from 'lucide-react';
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
      // Save to history
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
      // Save to history
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
    // Save to history
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
    <Card
      className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 to-[#225F91]/5 opacity-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 rounded-br-2xl" />
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full animate-pulse" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-[#1ABA7F]/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#225F91]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      <CardContent className="p-6 relative z-10">
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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            className="pl-12 pr-20 h-12 text-base font-medium rounded-xl border border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown || showHistory}
            aria-controls="suggestions-list"
          />
          
          {/* Voice Search Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={startVoiceSearch}
            disabled={isListening}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-[#225F91] hover:text-[#1A4971] hover:bg-[#225F91]/10"
            aria-label="Voice search"
          >
            <Mic className={cn("h-4 w-4", isListening && "animate-pulse text-[#1ABA7F]")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInput;