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

export const useSearchLogic = (state, dispatch, t, apiUrl, fetchCart, guestId, cart) => {
  const abortControllerRef = useRef(null);
  const suggestionAbortRef = useRef(null);
  
  // Store current state in refs to avoid recreating handleSearch
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
      const minLoadTime = 300;
      if (elapsed < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
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

      const newHistoryItem = { id: medicationId, displayName: med?.displayName || '' };
      const newHistory = [
        newHistoryItem,
        ...currentState.searchHistory.filter((h) => h.id !== medicationId),
      ];
      dispatch({ type: api.ACTIONS.SET_SEARCH_HISTORY, payload: newHistory });
      saveHistoryDebounced(newHistory);

      // ✅ Call onComplete callback after everything is done
      if (options.onComplete) {
        setTimeout(() => options.onComplete(), 100);
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
  console.log('=== ADD TO CART DEBUG ===');
  console.log('Looking for medicationId:', medicationId);
  console.log('Different from pharmacyId:', pharmacyId);
  console.log('Current cartItems:', state.cartItems);
  
  // Check if medication exists in cart from a DIFFERENT pharmacy
  const existingCartItem = state.cartItems?.find(
    item => item.medication.id === medicationId && item.pharmacyId !== pharmacyId
  );

  console.log('Found existing item:', existingCartItem);

  if (existingCartItem) {
    console.log('Existing item details:');
    console.log('- ID:', existingCartItem.id);
    console.log('- Medication ID:', existingCartItem.medication.id);
    console.log('- Pharmacy ID:', existingCartItem.pharmacyId);
    console.log('- Pharmacy Name:', existingCartItem.pharmacyName);
    console.log('- Price:', existingCartItem.price);
    
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

    console.log('Dialog data being dispatched:', dialogData);

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

// Separate function to execute the actual add (used by both normal and duplicate flows)
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

// Return both functions
return {
  fetchSuggestions,
  handleSearch,
  handleAddToCart,
  executeAddToCart, // Export this for duplicate dialog handlers
};
};

export const useGeoLocation = (dispatch, t, setLocationStatus) => {
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus?.('denied');
      return; 
    }

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
        toast.info(
          'Location access denied. Please select your location manually.',
          { duration: 5000 }
        );
      } else {
        toast.error(t('errors.location_fetch'));
      }
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
  }, [dispatch, t, setLocationStatus]);
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