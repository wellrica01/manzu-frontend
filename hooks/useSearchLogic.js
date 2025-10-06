import { useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import * as api from '@/components/search/medicationApi';
import { TIMING, MESSAGES } from '@/constants/search';

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const useSearchLogic = (state, dispatch, t, apiUrl, fetchCart, guestId, cart) => {
  const abortControllerRef = useRef(null);
  const suggestionAbortRef = useRef(null);
  const timeoutRef = useRef(null); // Add this for cleanup
  
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveHistoryDebounced = useMemo(
    () =>
      debounce((history) => {
        api.saveSearchHistory(history);
      }, TIMING.HISTORY_SAVE_DEBOUNCE),
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchSuggestions = useCallback(
    async (query) => {
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }

    if (!query) {
      dispatch({ type: api.ACTIONS.SET_SUGGESTIONS, payload: [] });
      dispatch({ type: api.ACTIONS.SET_LOADING_SUGGESTIONS, payload: false });

      // If input is cleared, show history dropdown instead
      dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: true });
      dispatch({ type: api.ACTIONS.SHOW_HISTORY });
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
          payload: true,
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

      const currentState = stateRef.current;

      const med = currentState.suggestions.find((m) => m.id === medicationId);
      if (med) {
        dispatch({ type: api.ACTIONS.SET_SEARCH_TERM, payload: med.displayName });
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();
      dispatch({ type: api.ACTIONS.SET_IS_SEARCHING, payload: true });
      dispatch({ type: api.ACTIONS.SET_ERROR, payload: null });

      try {
        const data = await api.searchMedications(
          {
            medicationId,
            filters: currentState.filters,
            sortBy: currentState.sortBy,
            userLocation: currentState.userLocation,
            ignoreFilters: options.ignoreFilters,
          },
          t,
          apiUrl,
          abortControllerRef.current.signal
        );

        const elapsed = Date.now() - startTime;
        if (elapsed < TIMING.MIN_LOAD_TIME) {
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(resolve, TIMING.MIN_LOAD_TIME - elapsed);
          });
        }
        
        dispatch({ type: api.ACTIONS.SET_RESULTS, payload: data });
        dispatch({ type: api.ACTIONS.SET_SHOW_DROPDOWN, payload: false });
        dispatch({ type: api.ACTIONS.SET_FOCUSED_INDEX, payload: -1 });

        await fetchCart();

        if (
          options.ignoreFilters ||
          (!currentState.filters.state && !currentState.filters.lga && !currentState.filters.ward)
        ) {
          dispatch({ type: api.ACTIONS.SET_DEFAULT_RESULTS, payload: data });
        }
      
        const previousHistoryItem = currentState.searchHistory.find((h) => h.id === medicationId);
        const newHistoryItem = {
          id: medicationId,
          displayName: med?.displayName || previousHistoryItem?.displayName || '',
        };

        const newHistory = [
          newHistoryItem,
          ...currentState.searchHistory.filter((h) => h.id !== medicationId),
        ];
        dispatch({ type: api.ACTIONS.SET_SEARCH_HISTORY, payload: newHistory });
        saveHistoryDebounced(newHistory);

        if (options.onComplete) {
          timeoutRef.current = setTimeout(() => options.onComplete(), 100);
        }

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
    [dispatch, t, apiUrl, fetchCart, saveHistoryDebounced]
  );

  const handleAddToCart = async (medicationId, pharmacyId, medicationName, pharmacyName, quantity = 1) => {
    const existingCartItem = state.cartItems?.find(
      item => item.medication.id === medicationId && item.pharmacyId !== pharmacyId
    );

    if (existingCartItem) {
      const newItemPrice = state.results
        .find(r => r.id === medicationId)
        ?.availability
        ?.find(a => a.pharmacyId === pharmacyId)
        ?.price || 0;

      const dialogData = {
        isOpen: true,
        existingItem: {
          medicationName: medicationName,
          pharmacyName: existingCartItem.pharmacyName || 'Unknown Pharmacy',
          price: existingCartItem.price,
          quantity: existingCartItem.quantity,
          cartItemId: existingCartItem.id,
          pharmacyId: existingCartItem.pharmacyId
        },
        newItem: {
          medicationName: medicationName,
          pharmacyName: pharmacyName,
          price: newItemPrice,
          quantity: quantity,
          medicationId,
          pharmacyId
        }
      };

      dispatch({
        type: api.ACTIONS.SET_DUPLICATE_DIALOG,
        payload: dialogData
      });

      dispatch({
        type: api.ACTIONS.SET_PENDING_ADD,
        payload: { medicationId, pharmacyId, medicationName, pharmacyName, quantity }
      });

      return;
    }

    await executeAddToCart(medicationId, pharmacyId, medicationName, pharmacyName, quantity);
  };

  const executeAddToCart = async (medicationId, pharmacyId, medicationName, pharmacyName, quantity = 1) => {
    const key = `${medicationId}-${pharmacyId}`;
    dispatch({ type: api.ACTIONS.SET_ADDING_TO_CART, payload: { [key]: true } });

    try {
      const result = await api.addToCart({ medicationId, pharmacyId, quantity, guestId }, t, apiUrl);
      
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
    executeAddToCart,
  };
};

export const useGeoLocation = (dispatch, t, setLocationStatus) => {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    
    if (!navigator.geolocation) {
      setLocationStatus?.('denied');
      return; 
    }

    hasRequestedRef.current = true;

    const successHandler = (position) => {
      dispatch({
        type: api.ACTIONS.SET_USER_LOCATION,
        payload: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
      setLocationStatus?.('granted');
    };

    const errorHandler = (error) => {
      setLocationStatus?.('denied');

      if (error.code === error.PERMISSION_DENIED) {
        toast.info(MESSAGES.LOCATION_DENIED, { duration: 5000 });
      } else if (error.code === error.TIMEOUT) {
        toast.error(MESSAGES.LOCATION_TIMEOUT);
      }
    };

    const options = {
      enableHighAccuracy: false,
      timeout: TIMING.GEO_TIMEOUT,
      maximumAge: TIMING.GEO_MAX_AGE
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
  }, [dispatch, setLocationStatus, t]);
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
      dispatch({
        type: api.ACTIONS.SET_FILTERS,
        payload: { state: match.state, lga: '', ward: '' },
      });

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
    }
  }, [userLocation, geoData, dispatch]);
};