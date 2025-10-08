'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { History, TrendingUp, X, ChevronRight } from 'lucide-react';
import SearchInput from './SearchInput';
import CartDialog from '../cart/CartDialog';
import DuplicateMedicationDialog from '@/components/cart/DuplicateMedicationDialog';
import ErrorMessage from '@/components/ErrorMessage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import SearchSkeleton from './SearchSkeleton';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useMedicationSearch } from '@/hooks/useMedicationSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useGeoData } from '@/hooks/useGeoData';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';

const MedicationCard = dynamic(() => import('./MedicationCard'), {
  ssr: false,
});

// Constants
const MESSAGES = {
  LOCATION_ENABLED: 'Location enabled successfully',
  LOCATION_DENIED: 'Location access denied',
};

const ERROR_MESSAGES = {
  API_URL_MISSING: 'API URL is not configured',
};

// Validate API URL
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(ERROR_MESSAGES.API_URL_MISSING);
  }
  return url;
};

// Smooth scroll utility
const smoothScrollToElement = (element, offset = 100, duration = 700) => {
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

const SearchBar = () => {
  const { t } = useTranslation();
  const apiUrl = getApiUrl();
  
  // Core hooks
  const { cart, fetchCart, isInCart, guestId } = useCart();
  const suggestions = useSearchSuggestions(apiUrl);
  const search = useMedicationSearch(apiUrl);
  const history = useSearchHistory();

  // Cart operations hook
  const cartOps = useCartOperations(null, guestId, null, fetchCart);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ state: '', lga: '', ward: '' });
  const [filtersWereSet, setFiltersWereSet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('cheapest');
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  
  // Cart dialog state
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState([]);

  // Refs
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const currentMedicationIdRef = useRef(null);

  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);

  // Filter state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');


    // Location and geo data
    const { 
      geoData, 
      states, 
      getLgas, 
      getWards,
      loading: geoLoading,
      error: geoError,
      reverseGeocode 
    } = useGeoData();
    
    const {
      userLocation,
      locationStatus,
      requestLocation,
    } = useLocationDetection();


  // Callback for when items are added (shows cart dialog)
  const handleItemsAdded = useCallback((items) => {
    // Transform items to match CartDialog expected format
  const formattedItems = items.map(item => ({
      id: item.id || crypto.randomUUID?.(), // optional
      name: item.name,                     
      pharmacy: item.pharmacy,            
      quantity: item.quantity,
    }));
    
    setLastAddedItems(formattedItems);
    setOpenCartDialog(true);
  }, []);


  // Build pharmacy recommendations structure for duplicate detection
  const pharmacyRecommendations = useCallback(() => {
    if (!search.results.length) return [];
    
    // Extract unique pharmacies from search results
    const pharmacyMap = new Map();
    
    search.results.forEach(med => {
      if (!med.availability) return;
      
      med.availability.forEach(avail => {
        if (!pharmacyMap.has(avail.pharmacyId)) {
          pharmacyMap.set(avail.pharmacyId, {
            pharmacyId: avail.pharmacyId,
            pharmacyName: avail.pharmacyName,
            meds: []
          });
        }
        
        pharmacyMap.get(avail.pharmacyId).meds.push({
          id: med.id,
          displayName: med.displayName,
          price: avail.price,
        });
      });
    });
    
    return Array.from(pharmacyMap.values());
  }, [search.results]);


  // Build medications list for duplicate detection
  const medications = useCallback(() => {
    return search.results.map(med => ({
      id: med.id,
      displayName: med.displayName,
      quantity: 1, // Default quantity for search
    }));
  }, [search.results]);


  // Duplicate detection hook
  const duplicateDetection = useDuplicateDetection({
    cart,
    isInCart,
    pharmacyRecommendations: pharmacyRecommendations(),
    medications: medications(),
    addToCart: cartOps.addToCart,
    bulkAddToCart: cartOps.bulkAddToCart,
    removeFromCart: cartOps.removeFromCart,
    bulkRemoveFromCart: cartOps.bulkRemoveFromCart,
    onItemsAdded: handleItemsAdded,
  });


  // Update LGAs when state changes
  const updateLgas = useCallback((stateName) => {
    setLgas(getLgas(stateName));
    setWards([]);
    setFilters(prev => ({ ...prev, lga: '', ward: '' }));
  }, [getLgas]);

  // Update wards when LGA changes
  const updateWards = useCallback((stateName, lgaName) => {
    setWards(getWards(stateName, lgaName));
    setFilters(prev => ({ ...prev, ward: '' }));
  }, [getWards]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ state: '', lga: '', ward: '' });
    setSortBy('cheapest');
    setLgas([]);
    setWards([]);
    setFiltersWereSet(false);
    search.restoreDefaults();
    setSelectedMedicationId(null);
  }, [search]);

  
  const setFilterStateWrapper = (val) => {
    setFilters(prev => ({ ...prev, state: val }));
    if (val) {
      setFiltersWereSet(true);
      updateLgas(val); // Trigger LGA update
    } else {
      setFiltersWereSet(false);
      setLgas([]);
      setWards([]);
    }
  };

  const setFilterLgaWrapper = (val) => {
    setFilters(prev => ({ ...prev, lga: val }));
    if (val) {
      setFiltersWereSet(true);
      updateWards(filters.state, val); // Trigger Ward update
    } else {
      setWards([]);
    }
  };

  const setFilterWardWrapper = (val) => {
    setFilters(prev => ({ ...prev, ward: val }));
    if (val) setFiltersWereSet(true);
  };


  // Handle location enable
  const handleEnableLocation = useCallback(() => {
    requestLocation()
      .then(() => toast.success('Location enabled successfully'))
      .catch((error) => {
        if (error.code === 1) {
          toast.error('Location permission denied. Please enable in browser settings.');
        } else {
          toast.error('Unable to get location. Please try again.');
        }
      });
  }, [requestLocation]);


  // Fetch suggestions on search term change
  useEffect(() => {
    suggestions.fetchSuggestions(searchTerm);
  }, [searchTerm, suggestions.fetchSuggestions]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      suggestions.setShowDropdown(false);
      history.setShowHistory(false);
      inputRef.current?.blur();
    }
  }, [suggestions, history]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setTimeout(() => {
          suggestions.setShowDropdown(false);
          history.setShowHistory(false);
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestions, history]);

  // Clear results when search term changes significantly
  useEffect(() => {
    if (searchTerm && search.results.length > 0) {
      const currentMedName = search.results[0]?.displayName?.toLowerCase();
      const currentSearchTerm = searchTerm.toLowerCase().trim();
      
      if (currentMedName && currentSearchTerm !== currentMedName) {
        search.clearResults();
      }
    }
  }, [searchTerm, search]);


  // Search handler
  const handleSearch = useCallback(async (medicationId, options = {}) => {
    if (!medicationId) return;

    currentMedicationIdRef.current = medicationId;
    setSelectedMedicationId(medicationId);

    const results = await search.search({
      medicationId,
      filters,
      userLocation,
      sortBy,
    });

    if (options.onComplete) {
      options.onComplete();
    }

    return results;
  }, [search, filters, userLocation, sortBy]);

  
// Handle filter changes
useEffect(() => {
  if (!currentMedicationIdRef.current) {
    return;
  }

  const hasFilters = filters.state || filters.lga || filters.ward;
  
  if (hasFilters) {
    handleSearch(currentMedicationIdRef.current, {
      onComplete: () => {
        setTimeout(() => {
          const comparisonSection = document.querySelector('[data-location-text]');
          smoothScrollToElement(comparisonSection, 100, 800);
        }, 300);
      }
    });
  } else {
    search.restoreDefaults();
  }
}, [filters.state, filters.lga, filters.ward]);


useEffect(() => {
  if (userLocation && geoData?.length) {
    const match = reverseGeocode(userLocation.lat, userLocation.lng);
    if (match) {
      setFilters(prev => ({
        ...prev,
        state: match.state,
        lga: match.lga,
      }));
      setFiltersWereSet(true);
      updateLgas(match.state);
    }
  }
}, [userLocation, geoData, reverseGeocode]);



  // Select medication from suggestions
  const handleSelectMedication = useCallback(async (suggestion) => {
    setSearchTerm(suggestion.displayName);
    suggestions.setShowDropdown(false);
    
    const results = await handleSearch(suggestion.id);
    
    if (results) {
      history.addToHistory({
        id: suggestion.id,
        displayName: suggestion.displayName,
      });
    }
  }, [handleSearch, suggestions, history]);

  // Add to cart handler - now uses duplicate detection like prescription workflow
  const handleAddToCart = useCallback(async (
    medicationId,
    pharmacyId,
    medicationName,
    pharmacyName,
    quantity = 1
  ) => {
    // Check for duplicates first (same as prescription workflow)
    const hasDuplicate = duplicateDetection.checkForDuplicates(
      medicationId,
      pharmacyId,
      medicationName
    );

    // If duplicate found, the dialog will handle it
    if (hasDuplicate) {
      return;
    }

    // No duplicate, add directly (same pattern as prescription workflow)
    try {
      const result = await cartOps.addToCart(
        medicationId,
        pharmacyId,
        medicationName,
        quantity
      );

      // Show cart dialog with added item
      if (result?.orderItem) {
        handleItemsAdded([{
          id: result.orderItem.id,
          name: medicationName,
          pharmacy: pharmacyName,
          quantity: result.orderItem.quantity || quantity,
        }]);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  }, [duplicateDetection, cartOps, handleItemsAdded]);


  return (
    <div className="w-full space-y-4 sm:space-y-6" role="search" aria-label="Medication search">
      {/* Cart Dialog */}
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItems={lastAddedItems}
        onRemoveItems={cartOps.bulkRemoveFromCart}
        isRemoving={cartOps.isRemoving}
      />

      {/* Duplicate Medication Dialog */}
      <DuplicateMedicationDialog
        isOpen={duplicateDetection.duplicateDialog.isOpen}
        onClose={duplicateDetection.closeDuplicateDialog}
        existingItem={duplicateDetection.duplicateDialog.existingItem}
        newItem={duplicateDetection.duplicateDialog.newItem}
        onKeepExisting={duplicateDetection.handleKeepExisting}
        onReplaceWithNew={duplicateDetection.handleReplaceWithNew}
        onAddBoth={duplicateDetection.handleAddBoth}
      />

      {/* Search Input */}
      <div className="relative w-full">
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          suggestions={suggestions.suggestions}
          setSuggestions={suggestions.clearSuggestions}
          isLoadingSuggestions={suggestions.isLoading}
          showDropdown={suggestions.showDropdown}
          setShowDropdown={suggestions.setShowDropdown}
          focusedSuggestionIndex={focusedSuggestionIndex}
          setFocusedSuggestionIndex={setFocusedSuggestionIndex}
          handleSearch={(id) => handleSearch(id)}
          handleSelectMedication={handleSelectMedication}
          dropdownRef={dropdownRef}
          inputRef={inputRef}
          suggestionRefs={suggestionRefs}
          searchHistory={history.history}
          setSearchHistory={() => {}}
          showHistory={history.showHistory}
          setShowHistory={history.setShowHistory}
        />



        {/* Dropdown */}
        {!search.isSearching &&
          search.results.length === 0 && 
          ((suggestions.showDropdown && (suggestions.suggestions.length > 0 || searchTerm.trim().length > 0)) ||
            (history.showHistory && history.history.length > 0) ||
            suggestions.isLoading) && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-[9999] mt-2 pointer-events-auto custom-scrollbar"
            style={{ maxHeight: '24rem', overflowY: 'auto' }}
            role="listbox"
            aria-label="Search suggestions"
          >
            <div className="bg-white/98 backdrop-blur-xl border-2 border-[#1ABA7F]/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Search History Section */}
              {history.showHistory && history.history.length > 0 && (
                <div>
                  <div className="p-3 border-b border-[#1ABA7F]/10 flex items-center justify-between bg-gradient-to-r from-[#1ABA7F]/5 to-transparent">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#1ABA7F]/10 rounded-lg">
                        <History className="h-4 w-4 text-[#225F91]" />
                      </div>
                      <span className="text-sm font-bold text-[#225F91]">
                        Recent Searches
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => history.setShowHistory(false)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      aria-label="Close search history"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {history.history.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-200 group animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 40}ms`, animationDuration: '300ms' }}
                    >
                      <button
                        onClick={() => {
                          setSearchTerm(item.displayName);
                          history.setShowHistory(false);
                          handleSearch(item.id);
                        }}
                        className="flex items-center gap-3 text-left flex-grow"
                        role="option"
                      >
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-[#1ABA7F]/20 group-hover:scale-110 transition-all duration-200">
                          <History className="h-4 w-4 text-gray-600 group-hover:text-[#225F91]" />
                        </div>
                        <span className="text-gray-700 font-semibold group-hover:text-[#225F91] transition-colors duration-200">
                          {item.displayName}
                        </span>
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          history.removeFromHistory(item.id);
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                        aria-label={`Delete ${item.displayName}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions Section */}
              {suggestions.showDropdown && suggestions.suggestions.length > 0 && (
                <div className="py-2">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      onClick={() => handleSelectMedication(suggestion)}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-4 group relative overflow-hidden animate-in fade-in slide-in-from-left-2',
                        focusedSuggestionIndex === index
                          ? 'bg-gradient-to-r from-[#1ABA7F]/15 to-[#225F91]/10'
                          : 'hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent'
                      )}
                      style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                      role="option"
                      aria-selected={focusedSuggestionIndex === index}
                    >
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] transition-all duration-300",
                        focusedSuggestionIndex === index ? "opacity-100" : "opacity-0"
                      )} />

                      {suggestion.imageUrl ? (
                        <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                          <img
                            src={suggestion.imageUrl}
                            alt={suggestion.displayName}
                            className="w-16 h-16 object-cover rounded-lg p-0.5 border-2 border-[#1ABA7F]/20 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:border-[#1ABA7F]/40 group-hover:shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp className="h-6 w-6 text-[#225F91]" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-800 truncate group-hover:text-[#225F91] transition-colors duration-200">
                          {suggestion.displayName}
                        </div>
                        <div className="font-medium text-sm text-gray-600 truncate">
                          {suggestion.ingredients
                            ?.map((ing) => {
                              const strength = ing.strengthValue ? ` ${ing.strengthValue}${ing.strengthUnit ?? ''}` : '';
                              return `${ing.activeSubstance}${strength}`;
                            })
                            .join(', ') || 'No ingredients listed'}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-[#1ABA7F] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {suggestions.showDropdown && 
                searchTerm && 
                suggestions.suggestions.length === 0 && 
                !suggestions.isLoading && (
                  <div className="p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                      <X className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold mb-1 text-lg">
                      No medications found
                    </p>
                    <p className="text-sm text-gray-500">
                      No matches for "<span className="font-bold text-[#225F91]">{searchTerm}</span>"
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      Try a different spelling or search term
                    </p>
                  </div>
                )}

              {/* Loading */}
              {suggestions.isLoading && (
                <div className="p-4 flex items-center gap-3 animate-in fade-in duration-300">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1ABA7F] border-t-transparent"></div>
                  <span className="text-gray-600 text-sm font-medium">
                    Searching medications...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <hr className="border-t border-gray-300 mb-6" />

      {/* Error Message */}
      <ErrorMessage error={search.error} />

      {/* Screen Reader Status */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {search.isSearching && "Searching for medications..."}
        {!search.isSearching && search.results.length > 0 && `Found ${search.results.length} result${search.results.length === 1 ? '' : 's'}`}
      </div>

      {/* Loading State */}
      {search.isSearching && search.results.length > 0 && (
        <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#1ABA7F]/10 via-[#225F91]/10 to-[#1ABA7F]/10 border-2 border-[#1ABA7F]/20 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-[#1ABA7F] border-t-transparent"></div>
            <div className="absolute inset-0 rounded-full border-3 border-[#1ABA7F]/20"></div>
          </div>
          <span className="text-sm font-bold text-[#225F91] animate-pulse">
            Updating results with your location filters...
          </span>
        </div>
      )}

      {search.isSearching && <SearchSkeleton />}

      {/* No Results */}
      {!search.isSearching &&
        search.results.length === 0 &&
        !search.error &&
        searchTerm &&
        !suggestions.showDropdown && (
          <div className="text-center px-1 py-8 sm:py-10 bg-white/95 border border-[#1ABA7F]/20 rounded-sm sm:rounded-2xl shadow-lg">
            <p className="text-gray-600 text-sm font-light sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
              {t('search.no_results', 
                { searchTerm }, 
                { defaultValue: `No medications found for "${searchTerm}"` }
              )}
            </p>
          </div>
        )}

      {/* Results */}
      {!search.isSearching &&
        search.results.map((med, index) => (
          <ErrorBoundary 
            key={med.id} 
            fallback={
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in duration-300">
                <p className="text-red-600 font-semibold">
                  Unable to display this medication card. Please try again.
                </p>
              </div>
            }
          >
            <div 
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >  
              <MedicationCard
                med={med}
                cart={cart}
                handleAddToCart={handleAddToCart}
                isInCart={isInCart}
                isAddingToCart={cartOps.isAddingToCart}
                searchTerm={searchTerm}
                state={filters.state}
                lga={filters.lga}
                ward={filters.ward}
                guestId={guestId}
                fetchCart={fetchCart}
                locationStatus={locationStatus}
                states={states}
                lgas={lgas}
                wards={wards}
                geoData={geoData}
                updateLgas={updateLgas}
                updateWards={updateWards}
                clearFilters={clearFilters}
                setFilterState={setFilterStateWrapper}
                setFilterLga={setFilterLgaWrapper}
                setFilterWard={setFilterWardWrapper}
                filtersWereSet={filtersWereSet}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onSelectLocation={() => {
                  setShowFilters(true);
                  setTimeout(() => {
                    const filterElement = document.querySelector('[data-filters]');
                    smoothScrollToElement(filterElement, 80, 600);
                  }, 200);
                }}
                onEnableLocation={handleEnableLocation}
              />
            </div>
          </ErrorBoundary>
        ))}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;