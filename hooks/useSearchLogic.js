import { useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import * as api from '../components/search/medicationApi';

// Debounce utility
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const useSearchLogic = (state, dispatch, t, apiUrl, fetchCart, guestId) => {
  const abortControllerRef = useRef(null);
  const suggestionAbortRef = useRef(null);

  // Debounced history save
  const saveHistoryDebounced = useMemo(
    () =>
      debounce((history) => {
        api.saveSearchHistory(history);
      }, api.CONFIG.HISTORY_SAVE_DEBOUNCE_MS),
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }
    };
  }, []);

  // Fetch suggestions with abort support
  const fetchSuggestions = useCallback(
    async (query) => {
      // Cancel previous suggestion request
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }

      if (!query) {
        dispatch({ type: api.ACTIONS.SET_SUGGESTIONS, payload: [] });
        dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
        dispatch({ type: api.ACTIONS.SET_LOADING_SUGGESTIONS, payload: false });
        return;
      }

      suggestionAbortRef.current = new AbortController();
      dispatch({ type: api.ACTIONS.SET_LOADING_SUGGESTIONS, payload: true });

      try {
        const suggestions = await api.fetchSuggestions(
          query,
          t,
          apiUrl,
          suggestionAbortRef.current.signal
        );
        dispatch({ type: api.ACTIONS.SET_SUGGESTIONS, payload: suggestions });
        dispatch({
          type: api.ACTIONS.SET_SHOW_DROPDOWN,
          payload: suggestions.length > 0,
        });
        dispatch({ type: api.ACTIONS.SET_FOCUSED_INDEX, payload: -1 });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error(err.message);
          dispatch({ type: api.ACTIONS.SET_SUGGESTIONS, payload: [] });
          dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
        }
      } finally {
        if (!suggestionAbortRef.current.signal.aborted) {
          dispatch({ type: api.ACTIONS.SET_LOADING_SUGGESTIONS, payload: false });
        }
      }
    },
    [dispatch, t, apiUrl]
  );

const handleSearch = useCallback(
  async (medicationId, options = {}) => {
    if (!medicationId) return;

    // Find medication in suggestions to update input display
    const med = state.suggestions.find((m) => m.id === medicationId);
    if (med) {
      dispatch({ type: api.ACTIONS.SET_SEARCH_TERM, payload: med.displayName });
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: api.ACTIONS.SET_IS_SEARCHING, payload: true });
    dispatch({ type: api.ACTIONS.SET_ERROR, payload: null });

    try {
      // ALWAYS send only medicationId
      const data = await api.searchMedications(
        {
          medicationId,
          filters: state.filters,
          sortBy: state.sortBy,
          userLocation: state.userLocation,
          ignoreFilters: options.ignoreFilters,
        },
        t,
        apiUrl,
        abortControllerRef.current.signal
      );

      dispatch({ type: api.ACTIONS.SET_RESULTS, payload: data });
      dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
      dispatch({ type: api.ACTIONS.SET_FOCUSED_INDEX, payload: -1 });

      await fetchCart();

      // Save default results only if ignoreFilters is true or no filters
      if (
        options.ignoreFilters ||
        (!state.filters.state && !state.filters.lga && !state.filters.ward)
      ) {
        dispatch({ type: api.ACTIONS.SET_DEFAULT_RESULTS, payload: data });
      }

      // Update search history with ID + displayName
      const newHistoryItem = { id: medicationId, displayName: med?.displayName || '' };
      const newHistory = [
        newHistoryItem,
        ...state.searchHistory.filter((h) => h.id !== medicationId),
      ];
      dispatch({ type: api.ACTIONS.SET_SEARCH_HISTORY, payload: newHistory });
      saveHistoryDebounced(newHistory);

    } catch (err) {
      if (err.name !== 'AbortError') {
        dispatch({ type: api.ACTIONS.SET_RESULTS, payload: [] });
        dispatch({ type: api.ACTIONS.SET_ERROR, payload: err.message });
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        dispatch({ type: api.ACTIONS.SET_IS_SEARCHING, payload: false });
      }
    }
  },
  [
    dispatch,
    state.filters,
    state.sortBy,
    state.userLocation,
    state.searchHistory,
    state.suggestions,
    t,
    apiUrl,
    fetchCart,
    saveHistoryDebounced,
  ]
);




const handleAddToCart = async (medicationId, pharmacyId, medicationName, pharmacyName, quantity = 1) => {
  const key = `${medicationId}-${pharmacyId}`;
  dispatch({ type: api.ACTIONS.SET_ADDING_TO_CART, payload: { [key]: true } });

  try {
    const result = await api.addToCart({ medicationId, pharmacyId, quantity, guestId }, t, apiUrl);
    
   // Construct last added item as object
   const lastAddedItem = {
     id: result.orderItem.id,
     name: quantity > 1 ? `${medicationName} x${quantity}` : medicationName,
     pharmacy: pharmacyName || "Unknown Pharmacy",
     quantity: result.orderItem.quantity
   };

    dispatch({ type: api.ACTIONS.SET_LAST_ADDED_ITEMS, payload: [lastAddedItem] });
    dispatch({ type: api.ACTIONS.SET_OPEN_CART_DIALOG, payload: true });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', { medicationId, pharmacyId, quantity });
    }

    await fetchCart();

  } catch (err) {
    toast.error(err.message);
  } finally {
    dispatch({ type: api.ACTIONS.SET_ADDING_TO_CART, payload: { [key]: false } });
  }
};


return {
  fetchSuggestions,
  handleSearch,
  handleAddToCart,
  };
};

export const useGeoLocation = (dispatch, t) => {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const successHandler = (position) => {
      dispatch({
        type: api.ACTIONS.SET_USER_LOCATION,
        payload: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    };

    const errorHandler = () => {
      toast.error(t('errors.location_fetch'));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
  }, [dispatch, t]);
};

export const useGeoData = (dispatch, t) => {
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const data = await api.fetchGeoData();
        dispatch({ type: api.ACTIONS.SET_GEO_DATA, payload: data });
        dispatch({
          type: api.ACTIONS.SET_STATES,
          payload: data.map((s) => ({ value: s.state, label: s.state })),
        });
      } catch (err) {
        toast.error(t('errors.geo_data'), { duration: 4000 });
      }
    };
    loadGeoData();
  }, [dispatch, t]);
};

export const useAutoPopulateLocation = (
  userLocation,
  geoData,
  dispatch
) => {
  useEffect(() => {
    if (!userLocation || !geoData) return;

    const match = api.reverseGeocode(
      userLocation.lat,
      userLocation.lng,
      geoData
    );

    if (match) {
      // Only auto-populate state, leave LGA and ward empty
      dispatch({
        type: api.ACTIONS.SET_FILTERS,
        payload: { state: match.state, lga: '', ward: '' },
      });

      // Update LGAs for the matched state
      const stateData = geoData.find((s) => s.state === match.state);
      if (stateData) {
        dispatch({
          type: api.ACTIONS.SET_LGAS,
          payload: stateData.lgas.map((lga) => ({
            value: lga.name,
            label: lga.name,
          })),
        });
      }

      console.log('Auto-populated filter (state only):', match.state);
    }
  }, [userLocation, geoData, dispatch]);
};