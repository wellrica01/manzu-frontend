import { ACTIONS, loadSearchHistory } from './medicationApi';

export const initialState = {
  searchTerm: '',
  results: [],
  defaultResults: [],
  suggestions: [],
  error: null,
  cartItems: [],
  showDropdown: false,
  userLocation: null,
  isLoadingSuggestions: false,
  isAddingToCart: {},
  focusedSuggestionIndex: -1,
  openCartDialog: false,
  lastAddedItems: [],
  filters: { state: '', lga: '', ward: '' },
  sortBy: 'cheapest',
  states: [],
  lgas: [],
  wards: [],
  geoData: null,
  showFilters: false,
  isSearching: false,
  searchHistory: loadSearchHistory(),
  showHistory: false,
};

export function searchReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    
    case ACTIONS.SET_RESULTS:
      return { ...state, results: action.payload };
    
    case ACTIONS.SET_DEFAULT_RESULTS:
      return { ...state, defaultResults: action.payload };
    
    case ACTIONS.SET_SUGGESTIONS:
      return { ...state, suggestions: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.SET_CART_ITEMS:
      return { ...state, cartItems: action.payload };
    
    case ACTIONS.SET_SHOW_DROPDOWN:
      return { ...state, showDropdown: action.payload };
    
    case ACTIONS.SET_USER_LOCATION:
      return { ...state, userLocation: action.payload };
    
    case ACTIONS.SET_LOADING_SUGGESTIONS:
      return { ...state, isLoadingSuggestions: action.payload };
    
    case ACTIONS.SET_ADDING_TO_CART:
      return {
        ...state,
        isAddingToCart: { ...state.isAddingToCart, ...action.payload },
      };
    
    case ACTIONS.SET_FOCUSED_INDEX:
      return { ...state, focusedSuggestionIndex: action.payload };
    
    case ACTIONS.SET_OPEN_CART_DIALOG:
      return { ...state, openCartDialog: action.payload };
    
    case ACTIONS.SET_LAST_ADDED_ITEMS:
      return { ...state, lastAddedItems: action.payload };
    
    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case ACTIONS.SET_SORT_BY:
      return { ...state, sortBy: action.payload };
    
    case ACTIONS.SET_STATES:
      return { ...state, states: action.payload };
    
    case ACTIONS.SET_LGAS:
      return { ...state, lgas: action.payload };
    
    case ACTIONS.SET_WARDS:
      return { ...state, wards: action.payload };
    
    case ACTIONS.SET_GEO_DATA:
      return { ...state, geoData: action.payload };
    
    case ACTIONS.SET_SHOW_FILTERS:
      return { ...state, showFilters: action.payload };
    
    case ACTIONS.SET_IS_SEARCHING:
      return { ...state, isSearching: action.payload };
    
    case ACTIONS.SET_SEARCH_HISTORY:
      return { ...state, searchHistory: action.payload };
    
    case ACTIONS.SET_SHOW_HISTORY:
      return { ...state, showHistory: action.payload };
    
    default:
      return state;
  }
}