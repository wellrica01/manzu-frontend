'use client';
import { useEffect, useState, useRef, forwardRef, useReducer, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { History, TrendingUp, X } from 'lucide-react';
import SearchInput from './SearchInput';
import FilterControls from './FilterControls';
import CartDialog from './CartDialog';
import ErrorMessage from '@/components/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import SearchSkeleton from './SearchSkeleton';
import { searchReducer, initialState } from './searchReducer';
import {
  useSearchLogic,
  useGeoLocation,
  useGeoData,
  useAutoPopulateLocation,
} from '../../hooks/useSearchLogic';
import * as api from './medicationApi';

const MedicationCard = dynamic(() => import('./MedicationCard'), {
  ssr: false,
});

// --- SearchBar Component ---
const SearchBar = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { cart, fetchCart, guestId } = useCart();

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  const [selectedMedicationId, setSelectedMedicationId] = useState(null);


  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Custom hooks for separation of concerns
  useGeoData(dispatch, t);
  useGeoLocation(dispatch, t);
  useAutoPopulateLocation(state.userLocation, state.geoData, dispatch);

  const { fetchSuggestions, handleSearch, handleAddToCart } = useSearchLogic(
    state,
    dispatch,
    t,
    apiUrl,
    fetchCart,
    guestId
  );

  // Cleanup suggestion refs on unmount
  useEffect(() => {
    return () => {
      suggestionRefs.current = [];
    };
  }, []);

  // Update cart items when cart changes
  useEffect(() => {
    dispatch({
      type: api.ACTIONS.SET_CART_ITEMS,
      payload: cart?.pharmacies?.flatMap((p) => p.items) || [],
    });
  }, [cart]);

  // Debounced suggestions fetch
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(state.searchTerm);
    }, api.CONFIG.DEBOUNCE_DELAY_MS);
    return () => clearTimeout(debounce);
  }, [state.searchTerm, fetchSuggestions]);

  // Reset to default results when all filters are cleared
  useEffect(() => {
    const noFilters =
      !state.filters.state && !state.filters.lga && !state.filters.ward;

    if (noFilters && state.defaultResults.length > 0) {
      dispatch({
        type: api.ACTIONS.SET_RESULTS,
        payload: state.defaultResults,
      });
    }
  }, [
    state.filters.state,
    state.filters.lga,
    state.filters.ward,
    state.defaultResults,
  ]);

  // Check if medication is in cart
  const isInCart = useCallback(
    (medicationId, pharmacyId) => {
      return (
        cart?.pharmacies?.some(
          (ph) =>
            ph.pharmacy.id === pharmacyId &&
            ph.items?.some((item) => item.medication.id === medicationId)
        ) || false
      );
    },
    [cart]
  );

  // Update LGAs based on selected state
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

  // Update wards based on selected state and LGA
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
// Clear all filters
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
  // Reset selected medication so Apply button disables
  setSelectedMedicationId(null);
}, [state.defaultResults]);


  // Keyboard event handlers
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

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
        dispatch({ type: api.ACTIONS.SET_SHOW_HISTORY, payload: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Render ---
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Cart Dialog */}
      <CartDialog
        openCartDialog={state.openCartDialog}
        setOpenCartDialog={(val) =>
          dispatch({ type: api.ACTIONS.SET_OPEN_CART_DIALOG, payload: val })
        }
        lastAddedItems={state.lastAddedItems}
      />

      {/* Search Input */}
      <div ref={ref} className="relative w-full">
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
          handleSearch={handleSearch}
          handleSelectMedication={(suggestion) => {
            setSelectedMedicationId(suggestion.id);  
            handleSearch(suggestion.id);           
          }}
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

        {/* Suggestion / History / Loading Dropdown */}
        {!state.isSearching &&
          ((state.showDropdown && state.suggestions.length > 0) ||
            (state.showHistory && state.searchHistory.length > 0) ||
            state.isLoadingSuggestions) && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full z-[9999] mt-2 pointer-events-auto"
              style={{ maxHeight: '16rem', overflowY: 'auto' }}
              role="listbox"
              aria-label="Search suggestions"
            >
              <div className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl">
                {/* Search History */}
                {state.showHistory && state.searchHistory.length > 0 && (
                  <div>
                    <div className="p-2 sm:p-3 border-b border-[#1ABA7F]/10 flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <History className="h-3 sm:h-4 w-3 sm:w-4 text-[#225F91]" />
                        <span className="text-xs sm:text-sm font-medium text-[#225F91]">
                          Recent Searches
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          dispatch({
                            type: api.ACTIONS.SET_SEARCH_HISTORY,
                            payload: [],
                          });
                          api.clearSearchHistory();
                        }}
                        className="h-5 sm:h-6 w-5 sm:w-6 p-0 text-gray-400 hover:text-red-500"
                        aria-label="Clear search history"
                      >
                        <X className="h-2 sm:h-3 w-2 sm:w-3" />
                      </Button>
                    </div>

                    {state.searchHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          dispatch({
                            type: api.ACTIONS.SET_SEARCH_TERM,
                            payload: item.displayName,
                          });
                          dispatch({
                            type: api.ACTIONS.SET_SHOW_HISTORY,
                            payload: false,
                          });
                          handleSearch(item.id);
                        }}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3 text-left hover:bg-[#1ABA7F]/10 transition-colors duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
                        role="option"
                        aria-label={`Search for ${item.displayName}`}
                      >
                        <History className="h-3 sm:h-4 w-3 sm:w-4 text-gray-400" />
                        <span className="text-gray-700">{item.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions Dropdown */}
                {state.showDropdown && state.suggestions.length > 0 && (
                  <div className="pt-2 pb-4">
            {state.suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                ref={(el) => (suggestionRefs.current[index] = el)}
                onClick={() => handleSearch(suggestion.id)} // ← pass ID here
                className={cn(
                  'w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-colors duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base',
                  state.focusedSuggestionIndex === index
                    ? 'bg-[#1ABA7F]/10 text-[#225F91]'
                    : 'hover:bg-[#1ABA7F]/10 text-gray-700'
                )}
                role="option"
                aria-selected={state.focusedSuggestionIndex === index}
              >
                {suggestion.imageUrl ? (
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.displayName}
                    className="w-16 h-16 object-cover rounded-sm p-0.5 border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-[#225F91]" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{suggestion.displayName}</div>
                  <div className="font-light text-sm text-gray-600">
                    {suggestion.ingredients
                      ?.map((ing, i) => {
                        const strength = ing.strengthValue ? ` ${ing.strengthValue}${ing.strengthUnit ?? ''}` : '';
                        return (
                          <span key={i}>
                            {ing.activeSubstance}
                            {strength}
                            {i < suggestion.ingredients.length - 1 ? ', ' : ''}
                          </span>
                        );
                      })
                      .reduce((prev, curr) => [prev, curr], []) || 'No ingredients listed'}
                  </div>
                </div>
              </button>
            ))}
            </div>
          )}

                {/* Loading */}
                {state.isLoadingSuggestions && (
                  <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-[#1ABA7F]"></div>
                    <span className="text-gray-600 text-xs sm:text-sm">
                      Searching...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Filter Controls */}
      <FilterControls
        filterState={state.filters.state}
        setFilterState={(val) =>
          dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { state: val } })
        }
        filterLga={state.filters.lga}
        setFilterLga={(val) =>
          dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { lga: val } })
        }
        filterWard={state.filters.ward}
        setFilterWard={(val) =>
          dispatch({ type: api.ACTIONS.SET_FILTERS, payload: { ward: val } })
        }
        sortBy={state.sortBy}
        setSortBy={(val) =>
          dispatch({ type: api.ACTIONS.SET_SORT_BY, payload: val })
        }
        states={state.states}
        lgas={state.lgas}
        wards={state.wards}
        geoData={state.geoData}
        updateLgas={updateLgas}
        updateWards={updateWards}
        clearFilters={clearFilters}
        handleSearch={handleSearch}
        searchTerm={state.searchTerm}
        selectedMedicationId={selectedMedicationId}
        showFilters={state.showFilters}
        setShowFilters={(val) =>
          dispatch({ type: api.ACTIONS.SET_SHOW_FILTERS, payload: val })
        }
      />

      <hr className="border-t border-gray-300 mb-6" />

      {/* Error */}
      <ErrorMessage error={state.error} />

      {/* Loading skeleton */}
      {state.isSearching && <SearchSkeleton />}

      {/* No results message */}
      {!state.isSearching &&
        state.results.length === 0 &&
        !state.error &&
        state.searchTerm && (
          <div className="text-center px-1 py-8 sm:py-10 bg-white/95 border border-[#1ABA7F]/20 rounded-sm sm:rounded-2xl shadow-lg">
            <p className="text-gray-600 text-sm font-light sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
              {t('search.no_results', { searchTerm: state.searchTerm })}
            </p>
          </div>
        )}

      {/* Medication Cards */}
      {!state.isSearching &&
        state.results.map((med) => (
          <MedicationCard
            key={med.id}
            med={med}
            handleAddToCart={handleAddToCart}
            isInCart={isInCart}
            isAddingToCart={state.isAddingToCart}
            searchTerm={state.searchTerm}
            state={state.filters.state}
            lga={state.filters.lga}
            ward={state.filters.ward}
          />
        ))}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;