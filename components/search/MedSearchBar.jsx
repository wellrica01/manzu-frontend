'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { History, TrendingUp, X, ChevronRight, Search, MapPin } from 'lucide-react';
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

// Validate API URL
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('API URL is not configured');
  return url;
};

// Refined smooth scroll
const smoothScrollTo = (element, offset = 100) => {
  if (!element) return;
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: targetPosition, behavior: 'smooth' });
};

const SearchBar = () => {
  const { t } = useTranslation();
  const apiUrl = getApiUrl();
  
  // Core hooks
  const { cart, fetchCart, isInCart, guestId } = useCart();
  const suggestions = useSearchSuggestions(apiUrl);
  const search = useMedicationSearch(apiUrl);
  const history = useSearchHistory();
  const cartOps = useCartOperations(null, guestId, null, fetchCart);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ state: '', lga: '' });
  const [filtersWereSet, setFiltersWereSet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('cheapest');
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Refs
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const currentMedicationIdRef = useRef(null);

  // Location & geo data
  const { 
    geoData, 
    states, 
    getLgas, 
    getWards,
    reverseGeocode 
  } = useGeoData();
  
  const {
    userLocation,
    locationStatus,
    requestLocation,
  } = useLocationDetection();

  // Items added callback
  const handleItemsAdded = useCallback((items) => {
    const formattedItems = items.map(item => ({
      id: item.id || crypto.randomUUID?.(),
      name: item.name,
      pharmacy: item.pharmacy,
      quantity: item.quantity,
    }));
    setLastAddedItems(formattedItems);
    setOpenCartDialog(true);
  }, []);

  // Build pharmacy recommendations for duplicate detection
  const pharmacyRecommendations = useCallback(() => {
    if (!search.results.length) return [];
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

  const medications = useCallback(() => {
    return search.results.map(med => ({
      id: med.id,
      displayName: med.displayName,
      quantity: 1,
    }));
  }, [search.results]);

  // Duplicate detection
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

  // Update LGAs/Wards
  const updateLgas = useCallback((stateName) => {
    setLgas(getLgas(stateName));
    setWards([]);
    setFilters(prev => ({ ...prev, lga: '', ward: '' }));
  }, [getLgas]);

  const updateWards = useCallback((stateName, lgaName) => {
    setWards(getWards(stateName, lgaName));
    setFilters(prev => ({ ...prev, ward: '' }));
  }, [getWards]);

const clearFilters = useCallback(() => {
  setFilters({ state: '', lga: '' });
  setSortBy('cheapest');
  setLgas([]);
  setFiltersWereSet(false);
  search.restoreDefaults();
  setSelectedMedicationId(null);
}, [search]);


const setFilterStateWrapper = (val) => {
  setFilters(prev => ({ ...prev, state: val }));
  if (val) {
    setFiltersWereSet(true);
    updateLgas(val);
  } else {
    setFiltersWereSet(false);
    setLgas([]);
  }
};

const setFilterLgaWrapper = (val) => {
  setFilters(prev => ({ ...prev, lga: val }));
  if (val) {
    setFiltersWereSet(true);
  }
};


const handleEnableLocation = useCallback(() => {
    setIsLoadingLocation(true);
    requestLocation()
      .then(() => toast.success('Location detected successfully'))
      .catch((error) => {
        toast.error(error.code === 1 
          ? 'Location permission denied' 
          : 'Unable to get location');
        setIsLoadingLocation(false);
      });
  }, [requestLocation]);

  // Fetch suggestions on term change
  useEffect(() => {
    suggestions.fetchSuggestions(searchTerm);
  }, [searchTerm, suggestions.fetchSuggestions]);

  // Keyboard shortcuts
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

  // Click outside dropdown
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

  // Clear results when search term changes
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

    if (options.onComplete) options.onComplete();
    return results;
  }, [search, filters, userLocation, sortBy]);

  // Filter changes
useEffect(() => {
  if (!currentMedicationIdRef.current) return;

  const hasFilters = filters.state || filters.lga;
  
  if (hasFilters) {
    handleSearch(currentMedicationIdRef.current, {
      onComplete: () => {
        setTimeout(() => {
          const section = document.querySelector('[data-location-text]');
          smoothScrollTo(section, 100);
        }, 300);
      }
    });
  } else {
    search.restoreDefaults();
  }
}, [filters.state, filters.lga]);



// Reverse geocode on location
useEffect(() => {
  if (userLocation && geoData?.length) {
    const match = reverseGeocode(userLocation.lat, userLocation.lng, {
      includeNearby: true
    });
    
    console.log('Reverse geocode match:', match);
    
    if (match) {
      if (match.confidence.level === 'high' || match.confidence.level === 'good') {
        setFilterStateWrapper(match.state);
        setTimeout(() => {
          setFilterLgaWrapper(match.lga);
        }, 50);
        
        toast.success(
          `Location detected: ${match.state}, ${match.lga}`,
          { duration: 3000 }
        );
      } else {
        toast.info(
          `Approximate location: ${match.state}, ${match.lga} (${match.distance.toFixed(1)}km away). Please verify.`,
          {
            duration: 5000,
            action: {
              label: 'Adjust',
              onClick: () => setShowFilters(true)
            }
          }
        );
        
        setFilterStateWrapper(match.state);
        setTimeout(() => {
          setFilterLgaWrapper(match.lga);
        }, 50);
      }
      
      setIsLoadingLocation(false);
    } else {
      toast.error('Could not determine your location. Please select manually.');
      setIsLoadingLocation(false);
    }
  }
}, [userLocation, geoData, reverseGeocode]);


  // Select medication
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

  // Add to cart with duplicate detection
  const handleAddToCart = useCallback(async (
    medicationId,
    pharmacyId,
    medicationName,
    pharmacyName,
    quantity = 1
  ) => {
    const hasDuplicate = duplicateDetection.checkForDuplicates(
      medicationId,
      pharmacyId,
      medicationName
    );

    if (hasDuplicate) return;

    try {
      const result = await cartOps.addToCart(
        medicationId,
        pharmacyId,
        medicationName,
        quantity
      );

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
    <div className="w-full space-y-6" role="search" aria-label="Medication search">
      {/* Dialogs */}
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItems={lastAddedItems}
        onRemoveItems={cartOps.bulkRemoveFromCart}
        isRemoving={cartOps.isRemoving}
      />

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

        {/* Dropdown - Refined Design */}
        {!search.isSearching &&
          search.results.length === 0 && 
          ((suggestions.showDropdown && (suggestions.suggestions.length > 0 || searchTerm.trim().length > 0)) ||
            (history.showHistory && history.history.length > 0) ||
            suggestions.isLoading) && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-50 mt-3"
            role="listbox"
            aria-label="Search suggestions"
          >
            <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
              {/* Search History */}
              {history.showHistory && history.history.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-gray-500" strokeWidth={2} />
                      <span className="text-sm font-bold text-gray-700">Recent Searches</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => history.setShowHistory(false)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>

                  {history.history.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <button
                        onClick={() => {
                          setSearchTerm(item.displayName);
                          history.setShowHistory(false);
                          handleSearch(item.id);
                        }}
                        className="flex items-center gap-3 flex-grow text-left"
                      >
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-[#1ABA7F]/10 transition-colors duration-200">
                          <History className="h-4 w-4 text-gray-500 group-hover:text-[#1ABA7F]" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-[#225F91]">
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
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.showDropdown && suggestions.suggestions.length > 0 && (
                <div>
                  {suggestions.suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      onClick={() => handleSelectMedication(suggestion)}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-4 group',
                        focusedSuggestionIndex === index
                          ? 'bg-gray-50'
                          : 'hover:bg-gray-50'
                      )}
                      role="option"
                      aria-selected={focusedSuggestionIndex === index}
                    >
                      {suggestion.imageUrl ? (
                        <img
                          src={suggestion.imageUrl}
                          alt={suggestion.displayName}
                          className="w-12 h-12 object-cover rounded-lg border-2 border-gray-100 group-hover:border-[#1ABA7F]/30 transition-colors duration-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Search className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-800 truncate group-hover:text-[#225F91] transition-colors duration-200">
                          {suggestion.displayName}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {suggestion.ingredients
                            ?.map((ing) => {
                              const strength = ing.strengthValue ? ` ${ing.strengthValue}${ing.strengthUnit ?? ''}` : '';
                              return `${ing.activeSubstance}${strength}`;
                            })
                            .join(', ') || 'No ingredients listed'}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#1ABA7F] transition-colors duration-200" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {suggestions.showDropdown && 
                searchTerm && 
                suggestions.suggestions.length === 0 && 
                !suggestions.isLoading && (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <X className="h-8 w-8 text-gray-400" strokeWidth={2} />
                    </div>
                    <p className="text-gray-700 font-bold mb-2">No medications found</p>
                    <p className="text-sm text-gray-500">
                      No matches for "<span className="font-bold">{searchTerm}</span>"
                    </p>
                  </div>
                )}

              {/* Loading */}
              {suggestions.isLoading && (
                <div className="p-4 flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1ABA7F] border-t-transparent" />
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200" />

      {/* Error Message */}
      <ErrorMessage error={search.error} />

      {/* Screen Reader Status */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {search.isSearching && "Searching for medications..."}
        {!search.isSearching && search.results.length > 0 && 
          `Found ${search.results.length} result${search.results.length === 1 ? '' : 's'}`}
      </div>

      {/* Loading State - Refined */}
      {search.isSearching && search.results.length > 0 && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#1ABA7F]/5 border border-[#1ABA7F]/20">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1ABA7F] border-t-transparent" />
          <span className="text-sm font-medium text-gray-700">Updating results...</span>
        </div>
      )}

      {search.isSearching && <SearchSkeleton />}

      {/* No Results */}
      {!search.isSearching &&
        search.results.length === 0 &&
        !search.error &&
        searchTerm &&
        !suggestions.showDropdown && (
          <div className="text-center p-10 bg-white border-2 border-gray-100 rounded-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-gray-700 font-bold mb-2">No medications found</p>
            <p className="text-sm text-gray-500">
              Try a different search term or check your spelling
            </p>
          </div>
        )}

      {/* Results - Clean Animation */}
      {!search.isSearching &&
        search.results.map((med, index) => (
          <ErrorBoundary 
            key={med.id} 
            fallback={
              <div className="p-6 bg-red-50 border-2 border-red-100 rounded-xl">
                <p className="text-red-600 font-medium text-sm">
                  Unable to display this medication. Please try again.
                </p>
              </div>
            }
          >
            <div className="transition-opacity duration-300">
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
                filtersWereSet={filtersWereSet}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onSelectLocation={() => {
                  setShowFilters(true);
                  setTimeout(() => {
                    const filterElement = document.querySelector('[data-filters]');
                    smoothScrollTo(filterElement, 80);
                  }, 200);
                }}
                onEnableLocation={handleEnableLocation}
                isLoadingLocation={isLoadingLocation}
              />
            </div>
          </ErrorBoundary>
        ))}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;