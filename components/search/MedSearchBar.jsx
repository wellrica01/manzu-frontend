'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '@/hooks/useCart';
import SearchInput from './SearchInput';
import FilterControls from './FilterControls';
const MedicationCard = dynamic(() => import('./MedicationCard'), { ssr: false });
import CartDialog from './CartDialog';
import ErrorMessage from '@/components/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { History, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Loading skeleton component
const SearchSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="h-12 sm:h-16 bg-gray-200 rounded-lg sm:rounded-2xl"></div>
    <div className="h-24 sm:h-32 bg-gray-200 rounded-lg sm:rounded-2xl"></div>
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 sm:h-48 bg-gray-200 rounded-lg sm:rounded-2xl"></div>
      ))}
    </div>
  </div>
);

export default function SearchBar() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [sortBy, setSortBy] = useState('cheapest');
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const { cart, fetchCart, guestId } = useCart();

  useEffect(() => {
    fetch('/data/full.json')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setStates(data.map(state => ({ value: state.state, label: state.state })));
      })
      .catch(err => {
        console.error('Failed to load geo data:', err);
        toast.error(t('errors.geo_data'), { duration: 4000 });
      });
  }, [t]);

  const updateLgas = (state) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData ? stateData.lgas.map(lga => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  };

  const updateWards = (state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  };

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSortBy('cheapest');
    setLgas([]);
    setWards([]);
    if (searchTerm) handleSearch(searchTerm);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.error(t('errors.location_fetch'));
        }
      );
    }
  }, [t]);

  useEffect(() => {
    setCartItems(cart?.pharmacies?.flatMap(p => p.items) || []);
  }, [cart]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoadingSuggestions(false);
      return;
    }
    try {
      setIsLoadingSuggestions(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/medication-suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(t('errors.suggestions_failed'));
      const data = await response.json();
      setSuggestions(data);
      setShowDropdown(true);
      setFocusedSuggestionIndex(-1);
    } catch (err) {
      toast.error(t('errors.suggestions_failed'));
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = async (term) => {
    try {
      setError(null);
      setIsSearching(true);
      const queryParams = new URLSearchParams({ q: term });
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      queryParams.append('sortBy', sortBy);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error(t('errors.search_failed'));
      const data = await response.json();
      setResults(data);
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
      await fetchCart();
      setSearchHistory(prev => {
        const newHistory = [term, ...prev];
        return [...new Set(newHistory)];
      });
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMedication = async (med) => {
    setSearchTerm(med.displayName);
    setShowDropdown(false);
    setFocusedSuggestionIndex(-1);
    try {
      setError(null);
      const queryParams = new URLSearchParams({ medicationId: med.id });
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      queryParams.append('sortBy', sortBy);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error(t('errors.search_failed'));
      const data = await response.json();
      setResults(data);
      await fetchCart();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

const handleAddToCart = async (medicationId, pharmacyId, medicationName) => {
  const quantity = 1;
  const itemKey = `${medicationId}-${pharmacyId}`;
  try {
    if (!medicationId || !pharmacyId) throw new Error(t('errors.invalid_selection'));
    setIsAddingToCart(prev => ({ ...prev, [itemKey]: true }));
    console.log('Sending to /api/cart/add:', { medicationId, pharmacyId, quantity });
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId,
      },
      body: JSON.stringify({ medicationId, pharmacyId, quantity }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t('errors.add_to_cart_failed'));
    }
    setLastAddedItem(medicationName);
    setOpenCartDialog(true);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', { medicationId, pharmacyId });
    }
    await fetchCart();
  } catch (err) {
    toast.error(`Error: ${err.message}`);
  } finally {
    setIsAddingToCart(prev => ({ ...prev, [itemKey]: false }));
  }
};

const isInCart = (medicationId, pharmacyId) => {
  console.log('Checking isInCart:', { medicationId, pharmacyId, cart });
  return cart?.pharmacies?.some(pharmacy =>
    pharmacy.pharmacy.id === pharmacyId &&
    pharmacy.items?.some(item => item.medication.id === medicationId)
  ) || false;
};

// Add logging for results
console.log('Search results:', results);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItem={lastAddedItem}
      />
      
      {/* Search Input and Dropdown */}
      <div className="relative w-full">
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          setIsLoadingSuggestions={setIsLoadingSuggestions}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          focusedSuggestionIndex={focusedSuggestionIndex}
          setFocusedSuggestionIndex={setFocusedSuggestionIndex}
          handleSearch={handleSearch}
          handleSelectMedication={handleSelectMedication}
          dropdownRef={dropdownRef}
          inputRef={inputRef}
          suggestionRefs={suggestionRefs}
          searchHistory={searchHistory}
          setSearchHistory={setSearchHistory}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />
        {(showDropdown && suggestions.length > 0) || (showHistory && searchHistory.length > 0) || isLoadingSuggestions ? (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-[9999] mt-2 pointer-events-auto"
            style={{ maxHeight: '16rem', overflowY: 'auto' }} // Ensures dropdown is scrollable and in front
          >
            <div className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl">
              {/* Search History */}
              {showHistory && searchHistory.length > 0 && (
                <div>
                  <div className="p-2 sm:p-3 border-b border-[#1ABA7F]/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <History className="h-3 sm:h-4 w-3 sm:w-4 text-[#225F91]" />
                        <span className="text-xs sm:text-sm font-medium text-[#225F91]">Recent Searches</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('searchHistory');
                        }}
                        className="h-5 sm:h-6 w-5 sm:w-6 p-0 text-gray-400 hover:text-red-500"
                        aria-label="Clear search history"
                      >
                        <X className="h-2 sm:h-3 w-2 sm:w-3" />
                      </Button>
                    </div>
                  </div>
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(term);
                        setShowHistory(false);
                        handleSearch(term);
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-[#1ABA7F]/10 transition-colors duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
                      role="option"
                    >
                      <History className="h-3 sm:h-4 w-3 sm:w-4 text-gray-400" />
                      <span className="text-gray-700">{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      onClick={() => {
                        handleSelectMedication(suggestion);
                      }}
                      className={cn(
                        "w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-colors duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base",
                        focusedSuggestionIndex === index
                          ? "bg-[#1ABA7F]/10 text-[#225F91]"
                          : "hover:bg-[#1ABA7F]/10 text-gray-700"
                      )}
                      role="option"
                      aria-selected={focusedSuggestionIndex === index}
                    >
                      <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-[#225F91]" />
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.displayName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading State */}
              {isLoadingSuggestions && (
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-[#1ABA7F]"></div>
                    <span className="text-gray-600 text-xs sm:text-sm">Searching...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      
      <FilterControls
        filterState={filterState}
        setFilterState={setFilterState}
        filterLga={filterLga}
        setFilterLga={setFilterLga}
        filterWard={filterWard}
        setFilterWard={setFilterWard}
        sortBy={sortBy}
        setSortBy={setSortBy}
        states={states}
        lgas={lgas}
        wards={wards}
        geoData={geoData}
        updateLgas={updateLgas}
        updateWards={updateWards}
        clearFilters={clearFilters}
        handleSearch={handleSearch}
        searchTerm={searchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      <ErrorMessage error={error} />
      {isSearching ? (
        <SearchSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {results.length === 0 && !error && searchTerm ? (
            <div className="text-center py-8 sm:py-10 bg-white/95 border border-[#1ABA7F]/20 rounded-lg sm:rounded-2xl shadow-lg">
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
                {t('search.no_results', { searchTerm })}
              </p>
            </div>
          ) : results.length === 0 && !searchTerm ? (
            <div className="text-center py-8 sm:py-10 bg-white/95 border border-[#1ABA7F]/20 rounded-lg sm:rounded-2xl shadow-lg">
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
                {t('search.enter_medication')}
              </p>
            </div>
          ) : (
            results.map((med) => (
              <MedicationCard
                key={med.id}
                med={med}
                handleAddToCart={handleAddToCart}
                isInCart={isInCart}
                isAddingToCart={isAddingToCart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}