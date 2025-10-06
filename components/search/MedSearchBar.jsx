'use client';
import { useEffect, useState, useRef, useReducer, useCallback, useMemo } from 'react';
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
import { bulkRemoveCartItems } from '@/components/cart/cartApi';
import SearchSkeleton from './SearchSkeleton';
import { searchReducer, initialState } from './searchReducer';
import {
  useSearchLogic,
  useGeoData,
  useAutoPopulateLocation,
} from '../../hooks/useSearchLogic';
import * as api from './medicationApi';
import { TIMING, MESSAGES, ERROR_MESSAGES } from '../../constants/search';

const MedicationCard = dynamic(() => import('./MedicationCard'), {
  ssr: false,
});

// Validate API URL
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(ERROR_MESSAGES.API_URL_MISSING);
  }
  return url;
};

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
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { cart, fetchCart, isInCart, guestId } = useCart();

  const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  const [currentMedicationId, setCurrentMedicationId] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');

  const handleLocationStatusChange = useCallback((status) => {
    setLocationStatus(status);
  }, []);

  useEffect(() => {
    if (state.userLocation) {
      setLocationStatus('granted');
    }
  }, [state.userLocation]);

  const apiUrl = getApiUrl();

  useGeoData(dispatch, t);
  useAutoPopulateLocation(state.userLocation, state.geoData, dispatch);

  const { fetchSuggestions, handleSearch, handleAddToCart, executeAddToCart } = useSearchLogic(
    state,
    dispatch,
    t,
    apiUrl,
    fetchCart,
    guestId,
    cart
  );

  useEffect(() => {
    return () => {
      suggestionRefs.current = [];
    };
  }, []);

  // Memoize flattened cart items
  const flattenedCartItems = useMemo(() => {
    if (!cart?.pharmacies) return [];
    
    return cart.pharmacies.flatMap((pharmacyGroup) => 
      pharmacyGroup.items.map(item => ({
        ...item,
        pharmacyId: pharmacyGroup.pharmacy.id,   
        pharmacyName: pharmacyGroup.pharmacy.name   
      }))
    );
  }, [cart?.pharmacies]);

  useEffect(() => {
    dispatch({
      type: api.ACTIONS.SET_CART_ITEMS,
      payload: flattenedCartItems,
    });
  }, [flattenedCartItems]);

  const handleKeepExisting = useCallback(() => {
    toast.info(MESSAGES.KEEP_SELECTION);
    dispatch({
      type: api.ACTIONS.SET_DUPLICATE_DIALOG,
      payload: { isOpen: false, existingItem: null, newItem: null }
    });
    dispatch({ type: api.ACTIONS.SET_PENDING_ADD, payload: null });
  }, []);

  const handleReplaceWithNew = useCallback(async () => {
    const { existingItem, newItem } = state.duplicateDialog;
    const pending = state.pendingAdd;

    try {
      await fetch(`${apiUrl}/api/cart/remove/${existingItem.cartItemId}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      await fetchCart();

      await executeAddToCart(
        pending.medicationId,
        pending.pharmacyId,
        pending.medicationName,
        pending.pharmacyName,
        pending.quantity
      );

      toast.success(`${MESSAGES.SWITCHED_PHARMACY} ${newItem.pharmacyName}`);
    } catch (error) {
      toast.error(error.message || 'Failed to replace item');
    } finally {
      dispatch({
        type: api.ACTIONS.SET_DUPLICATE_DIALOG,
        payload: { isOpen: false, existingItem: null, newItem: null }
      });
      dispatch({ type: api.ACTIONS.SET_PENDING_ADD, payload: null });
    }
  }, [state.duplicateDialog, state.pendingAdd, apiUrl, guestId, fetchCart, executeAddToCart]);

  const handleAddBoth = useCallback(async () => {
    const pending = state.pendingAdd;

    try {
      await executeAddToCart(
        pending.medicationId,
        pending.pharmacyId,
        pending.medicationName,
        pending.pharmacyName,
        pending.quantity
      );

      toast.info(MESSAGES.ADDED_BOTH);
    } catch (error) {
      toast.error('Failed to add both items');
    } finally {
      dispatch({
        type: api.ACTIONS.SET_DUPLICATE_DIALOG,
        payload: { isOpen: false, existingItem: null, newItem: null }
      });
      dispatch({ type: api.ACTIONS.SET_PENDING_ADD, payload: null });
    }
  }, [state.pendingAdd, executeAddToCart]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(state.searchTerm);
    }, TIMING.DEBOUNCE_DELAY);
    return () => clearTimeout(debounce);
  }, [state.searchTerm, fetchSuggestions]);

  const updateLgas = useCallback(
    (stateName) => {
      if (!state.geoData) return;
      const stateData = state.geoData.find((s) => s.state === stateName);
      dispatch({
        type: api.ACTIONS.SET_LGAS,
        payload: stateData
          ? stateData.lgas.map((lga) => ({ value: lga.name, label: lga.name }))
          : [],
      });
      dispatch({ type: api.ACTIONS.SET_WARDS, payload: [] });
      dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { lga: '', ward: '' } });
    },
    [state.geoData]
  );

  const updateWards = useCallback(
    (stateName, lgaName) => {
      if (!state.geoData) return;
      const stateData = state.geoData.find((s) => s.state === stateName);
      const lgaData = stateData?.lgas.find((l) => l.name === lgaName);
      dispatch({
        type: api.ACTIONS.SET_WARDS,
        payload: lgaData
          ? lgaData.wards.map((ward) => ({ value: ward.name, label: ward.name }))
          : [],
      });
      dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { ward: '' } });
    },
    [state.geoData]
  );

  const clearFilters = useCallback(() => {
    dispatch({
      type: api.ACTIONS.SET_FILTERS,
      payload: { state: '', lga: '', ward: '' },
    });
    dispatch({ type: api.ACTIONS.SET_SORT_BY, payload: 'cheapest' });
    dispatch({ type: api.ACTIONS.SET_LGAS, payload: [] });
    dispatch({ type: api.ACTIONS.SET_WARDS, payload: [] });
    dispatch({
      type: api.ACTIONS.SET_RESULTS,
      payload: state.defaultResults,
    });
    setSelectedMedicationId(null);
  }, [state.defaultResults]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
      dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: false });
      inputRef.current?.blur();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        // Smooth close with delay for better UX
        setTimeout(() => {
          dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
          dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: false });
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    if (state.searchTerm && state.results.length > 0) {
      const currentMedName = state.results[0]?.displayName?.toLowerCase();
      const currentSearchTerm = state.searchTerm.toLowerCase().trim();
      
      if (currentMedName && currentSearchTerm !== currentMedName) {
        dispatch({ type: api.ACTIONS.SET_RESULTS, payload: [] });
      }
    }
  }, [state.searchTerm, state.results]);

  const currentMedicationIdRef = useRef(null);

  const handleSearchWrapper = useCallback((medicationId) => {
    setSelectedMedicationId(medicationId);
    currentMedicationIdRef.current = medicationId;
    handleSearch(medicationId);
  }, [handleSearch]);

useEffect(() => {
  if (!currentMedicationIdRef.current || state.defaultResults.length === 0) {
    return;
  }

  const hasFilters = state.filters.state || state.filters.lga || state.filters.ward;
  
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
    dispatch({
      type: api.ACTIONS.SET_RESULTS,
      payload: state.defaultResults,
    });
  }
}, [state.filters.state, state.filters.lga, state.filters.ward, state.defaultResults, handleSearch, dispatch]);

  const handleSelectMedication = useCallback((suggestion) => {
    setSelectedMedicationId(suggestion.id);
    setCurrentMedicationId(suggestion.id);
    handleSearchWrapper(suggestion.id);
  }, [handleSearchWrapper]);

  const handleBulkRemove = useCallback(async (itemIds) => {
    setIsBulkRemoving(true);
    try {
      await bulkRemoveCartItems(guestId, itemIds);
      await fetchCart();
    } catch (error) {
      toast.error(ERROR_MESSAGES.REMOVE_ITEMS_FAILED, { duration: 3000 });
    } finally {
      setIsBulkRemoving(false);
    }
  }, [guestId, fetchCart]);

  return (
    <div className="w-full space-y-4 sm:space-y-6" role="search" aria-label="Medication search">
      <CartDialog
        openCartDialog={state.openCartDialog}
        setOpenCartDialog={(val) =>
          dispatch({ type: api.ACTIONS.SET_OPEN_CART_DIALOG, payload: val })
        }
        lastAddedItems={state.lastAddedItems}
        onRemoveItems={handleBulkRemove}
        isRemoving={isBulkRemoving}
      /> 

      <DuplicateMedicationDialog
        isOpen={state.duplicateDialog.isOpen}
        onClose={() => {
          dispatch({
            type: api.ACTIONS.SET_DUPLICATE_DIALOG,
            payload: { isOpen: false, existingItem: null, newItem: null }
          });
          dispatch({ type: api.ACTIONS.SET_PENDING_ADD, payload: null });
        }}
        existingItem={state.duplicateDialog.existingItem}
        newItem={state.duplicateDialog.newItem}
        onKeepExisting={handleKeepExisting}
        onReplaceWithNew={handleReplaceWithNew}
        onAddBoth={handleAddBoth}
      />

      <div className="relative w-full">
        <SearchInput
          searchTerm={state.searchTerm}
          setSearchTerm={(val) =>
            dispatch({ type: api.ACTIONS.SET_SEARCH_TERM, payload: val })
          }
          suggestions={state.suggestions}
          setSuggestions={(val) =>
            dispatch({ type: api.ACTIONS.SET_SUGGESTIONS, payload: val })
          }
          isLoadingSuggestions={state.isLoadingSuggestions}
          setIsLoadingSuggestions={(val) =>
            dispatch({ type: api.ACTIONS.SET_LOADING_SUGGESTIONS, payload: val })
          }
          showDropdown={state.showDropdown}
          setShowDropdown={(val) =>
            dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: val })
          }
          focusedSuggestionIndex={state.focusedSuggestionIndex}
          setFocusedSuggestionIndex={(val) =>
            dispatch({ type: api.ACTIONS.SET_FOCUSED_INDEX, payload: val })
          }
          handleSearch={handleSearchWrapper}
          handleSelectMedication={handleSelectMedication}
          dropdownRef={dropdownRef}
          inputRef={inputRef}
          suggestionRefs={suggestionRefs}
          searchHistory={state.searchHistory}
          setSearchHistory={(val) =>
            dispatch({ type: api.ACTIONS.SET_SEARCH_HISTORY, payload: val })
          }
          showHistory={state.showHistory}
          setShowHistory={(val) =>
            dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: val })
          }
        />

    {!state.isSearching &&
    state.results.length === 0 && 
      ((state.showDropdown && (state.suggestions.length > 0 || state.searchTerm.trim().length > 0)) ||
        (state.showHistory && state.searchHistory.length > 0) ||
        state.isLoadingSuggestions) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-[9999] mt-2 pointer-events-auto custom-scrollbar"
          style={{ maxHeight: '24rem', overflowY: 'auto' }}
          role="listbox"
          aria-label="Search suggestions"
        >
          <div className="bg-white/98 backdrop-blur-xl border-2 border-[#1ABA7F]/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Search History Section */}
            {state.showHistory && state.searchHistory.length > 0 && (
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
                    onClick={() => dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: false })}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    aria-label="Close search history"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {state.searchHistory.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-200 group animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 40}ms`, animationDuration: '300ms' }}
                  >
                    <button
                      onClick={() => {
                        dispatch({ type: api.ACTIONS.SET_SEARCH_TERM, payload: item.displayName });
                        dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: false });
                        handleSearchWrapper(item.id);
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
                        const newHistory = state.searchHistory.filter((h) => h.id !== item.id);
                        dispatch({ type: api.ACTIONS.SET_SEARCH_HISTORY, payload: newHistory });
                        api.saveSearchHistory(newHistory);
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
            {state.showDropdown && state.suggestions.length > 0 && (
              <div className="py-2">
                {state.suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    onClick={() => handleSelectMedication(suggestion)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-4 group relative overflow-hidden animate-in fade-in slide-in-from-left-2',
                      state.focusedSuggestionIndex === index
                        ? 'bg-gradient-to-r from-[#1ABA7F]/15 to-[#225F91]/10'
                        : 'hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent'
                    )}
                    style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                    role="option"
                    aria-selected={state.focusedSuggestionIndex === index}
                  >
                    {/* Selection indicator */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] transition-all duration-300",
                      state.focusedSuggestionIndex === index ? "opacity-100" : "opacity-0"
                    )} />

                    {/* Image */}
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-800 truncate group-hover:text-[#225F91] transition-colors duration-200">
                        {suggestion.displayName}
                      </div>
                      <div className="font-medium text-sm text-gray-600 truncate">
                        {suggestion.ingredients
                          ?.map((ing, i) => {
                            const strength = ing.strengthValue ? ` ${ing.strengthValue}${ing.strengthUnit ?? ''}` : '';
                            return `${ing.activeSubstance}${strength}`;
                          })
                          .join(', ') || 'No ingredients listed'}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-[#1ABA7F] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {state.showDropdown && 
              state.searchTerm && 
              state.suggestions.length === 0 && 
              !state.isLoadingSuggestions && (
                <div className="p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                    <X className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-1 text-lg">
                    No medications found
                  </p>
                  <p className="text-sm text-gray-500">
                    No matches for "<span className="font-bold text-[#225F91]">{state.searchTerm}</span>"
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Try a different spelling or search term
                  </p>
                </div>
              )}

            {/* Loading */}
            {state.isLoadingSuggestions && (
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

      <ErrorMessage error={state.error} />

      {/* Add aria-live for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {state.isSearching && "Searching for medications..."}
        {!state.isSearching && state.results.length > 0 && `Found ${state.results.length} result${state.results.length === 1 ? '' : 's'}`}
      </div>

    {state.isSearching && state.results.length > 0 && (
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

      {state.isSearching && <SearchSkeleton />}

      {!state.isSearching &&
        state.results.length === 0 &&
        !state.error &&
        state.searchTerm &&
        !state.showDropdown && (
          <div className="text-center px-1 py-8 sm:py-10 bg-white/95 border border-[#1ABA7F]/20 rounded-sm sm:rounded-2xl shadow-lg">
            <p className="text-gray-600 text-sm font-light sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
              {t('search.no_results', 
                { searchTerm: state.searchTerm }, 
                { defaultValue: `No medications found for "${state.searchTerm}"` }
              )}
            </p>
          </div>
        )}

{!state.isSearching &&
  state.results.map((med, index) => (
    <ErrorBoundary key={med.id} fallback={
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in duration-300">
        <p className="text-red-600 font-semibold">
          Unable to display this medication card. Please try again.
        </p>
      </div>
    }>
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
          isAddingToCart={state.isAddingToCart}
          searchTerm={state.searchTerm}
          state={state.filters.state}
          lga={state.filters.lga}
          ward={state.filters.ward}
          guestId={guestId}
          fetchCart={fetchCart}
          locationStatus={locationStatus}
          states={state.states}
          lgas={state.lgas}
          wards={state.wards}
          geoData={state.geoData}
          updateLgas={updateLgas}
          updateWards={updateWards}
          clearFilters={clearFilters}
          setFilterState={(val) =>
            dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { state: val } })
          }
          setFilterLga={(val) =>
            dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { lga: val } })
          }
          setFilterWard={(val) =>
            dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { ward: val } })
          }
          showFilters={state.showFilters}
          setShowFilters={(val) =>
            dispatch({ type: api.ACTIONS.SET_SHOW_FILTERS, payload: val })
          }
          onSelectLocation={() => {
            dispatch({ type: api.ACTIONS.SET_SHOW_FILTERS, payload: true });
            setTimeout(() => {
              const filterElement = document.querySelector('[data-filters]');
              smoothScrollToElement(filterElement, 80, 600);
            }, 200);
          }}
          onEnableLocation={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  dispatch({
                    type: api.ACTIONS.SET_USER_LOCATION,
                    payload: {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    },
                  });
                  setLocationStatus('granted');
                  toast.success(MESSAGES.LOCATION_ENABLED);
                },
                (error) => {
                  setLocationStatus('denied');
                  toast.error(MESSAGES.LOCATION_DENIED);
                }
              );
            }
          }}
        />
      </div>
    </ErrorBoundary>
  ))}

    </div>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;