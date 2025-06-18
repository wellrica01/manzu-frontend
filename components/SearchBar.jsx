'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, CheckCircle, ShoppingCart, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Select from 'react-select';
import { useCart } from '@/hooks/useCart';

// Custom react-select styles to match Shadcn
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    height: '48px',
    borderRadius: '0.5rem',
    border: `1px solid ${state.isFocused ? '#3b82f6' : '#e5e7eb'}`,
    backgroundColor: '#ffffff',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    '&:hover': { borderColor: '#3b82f6' },
    fontSize: '1rem',
    paddingLeft: '0.5rem',
  }),
  input: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#9ca3af',
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginTop: '0.25rem',
    zIndex: 20,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f9fafb' : '#ffffff',
    '&:hover': { backgroundColor: '#f9fafb' },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': { color: '#dc2626' },
  }),
};

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [userLocation, setUserLocation] = useState(null);
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

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const { fetchCart, guestId, subscribe } = useCart();

  // Load geo data for filters
  useEffect(() => {
    fetch('/data/full.json')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setStates(data.map(state => ({ value: state.state, label: state.state })));
      })
      .catch(err => {
        console.error('Failed to load geo data:', err);
        toast.error('Failed to load location filters', { duration: 4000 });
      });
  }, []);

  // Update LGAs when state changes
  const updateLgas = (state) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData ? stateData.lgas.map(lga => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  };

  // Update wards when LGA changes
  const updateWards = (state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  };

  // Clear filters
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
          toast.error('Unable to fetch location. Showing all pharmacies.');
        }
      );
    }
  }, []);

  const fetchCartLocal = async () => {
    const data = await fetchCart();
    if (data) {
      setCartItems(data.pharmacies?.flatMap(p => p.items) || []);
    }
  };

  useEffect(() => {
    fetchCartLocal();
    const unsubscribe = subscribe((_, newCart) => {
      setCartItems(newCart.pharmacies?.flatMap(p => p.items) || []);
    });
    return unsubscribe;
  }, [fetchCart, subscribe]);

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
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
      setShowDropdown(true);
      setFocusedSuggestionIndex(-1);
    } catch (err) {
      toast.error('Failed to load suggestions. Please try again.');
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(!!e.target.value);
  };

  const handleSearch = async (term) => {
    try {
      setError(null);
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
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
      await fetchCartLocal();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
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
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      await fetchCartLocal();
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
    if (!medicationId || !pharmacyId) throw new Error('Invalid medication or pharmacy');
    setIsAddingToCart(prev => ({ ...prev, [itemKey]: true }));
    // Optimistic update
    setCartItems(prev => [
      ...prev,
      {
        pharmacyMedicationMedicationId: medicationId,
        pharmacyMedicationPharmacyId: pharmacyId,
        quantity,
        medication: { displayName: medicationName },
      },
    ]);
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
      throw new Error(errorData.message || 'Failed to add to cart');
    }
    setLastAddedItem(medicationName);
    setOpenCartDialog(true);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', { medicationId, pharmacyId });
    }
    await fetchCart(); // Sync with server
  } catch (err) {
    toast.error(`Error: ${err.message}`);
    // Rollback optimistic update
    setCartItems(prev => prev.filter(item => 
      !(item.pharmacyMedicationMedicationId === medicationId && 
        item.pharmacyMedicationPharmacyId === pharmacyId)
    ));
  } finally {
    setIsAddingToCart(prev => ({ ...prev, [itemKey]: false }));
  }
};

  const isInCart = (medicationId, pharmacyId) => {
    if (!Array.isArray(cartItems)) return false;
    return cartItems.some(
      (item) =>
        item.pharmacyMedicationMedicationId === medicationId &&
        item.pharmacyMedicationPharmacyId === pharmacyId
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && focusedSuggestionIndex === -1 && searchTerm) {
      e.preventDefault();
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
      handleSelectMedication(suggestions[focusedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setFocusedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 p-6">
{/* Cart Confirmation Dialog */}
<Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
  <DialogContent
    className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
  >
    {/* Decorative Corner Accent */}
    <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
    <DialogHeader className="flex flex-col items-center gap-3">
      <CheckCircle
        className="h-12 w-12 text-green-500 animate-[pulse_1s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight text-center">
        Added to Cart!
      </DialogTitle>
    </DialogHeader>
    <p className="text-center text-gray-600 text-base font-medium mt-2">
      <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your cart.
    </p>
    <DialogFooter className="mt-8 flex justify-center gap-4">
      <Button
        variant="outline"
        onClick={() => setOpenCartDialog(false)}
        className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
        aria-label="Continue shopping"
      >
        Continue Shopping
      </Button>
      <Button
        asChild
        className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
      >
        <Link href="/cart" aria-label="View cart">
          View Cart
        </Link>
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Search Input */}
<Card
  className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
>
  {/* Decorative Corner Accent */}
  <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
  <CardContent className="p-8">
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/70 transition-transform duration-300 group-focus-within:scale-110"
      />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search for medications..."
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        className="pl-12 h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="suggestions-list"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="suggestions-list"
          className="absolute z-30 w-full mt-3 bg-white/95 backdrop-blur-md border border-gray-100/50 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] max-h-64 overflow-y-auto animate-in slide-in-from-top-5 fade-in-20 duration-300"
          role="listbox"
        >
          {isLoadingSuggestions ? (
            <div className="px-5 py-4 flex items-center text-primary">
              <svg
                className="animate-spin h-5 w-5 mr-3 text-primary"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-base font-medium text-gray-600">Loading...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((med, index) => (
              <div
                key={med.id}
                ref={(el) => (suggestionRefs.current[index] = el)}
                className={cn(
                  'px-5 py-3 cursor-pointer flex items-center gap-3 text-base font-medium text-gray-900 hover:bg-primary/10 transition-all duration-200',
                  index === focusedSuggestionIndex && 'bg-primary/15 shadow-inner'
                )}
                onClick={() => handleSelectMedication(med)}
                role="option"
                aria-selected={index === focusedSuggestionIndex}
              >
                <Search className="h-4 w-4 text-primary/50" aria-hidden="true" />
                <span className="truncate">{med.displayName}</span>
              </div>
            ))
          ) : (
            searchTerm && (
              <div className="px-5 py-4 text-gray-500 text-base font-medium">
                No medications found for "{searchTerm}"
              </div>
            )
          )}
        </div>
      )}
    </div>
  </CardContent>
</Card>

{/* Filter Controls */}
<Card
  className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
>
  {/* Decorative Corner Accent */}
  <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
  <div
    className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:bg-primary/20 transition-colors duration-300"
    onClick={() => setShowFilters(!showFilters)}
    role="button"
    aria-expanded={showFilters}
    aria-controls="filter-content"
  >
    <div className="flex items-center gap-3">
      <Filter className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
      <span className="text-lg font-bold text-primary tracking-tight">
        {showFilters ? 'Hide Filters' : 'Refine Your Search'}
      </span>
    </div>
    {(filterState || filterLga || filterWard || sortBy !== 'cheapest') && (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          clearFilters();
        }}
        className="text-red-500 hover:text-red-600 hover:bg-red-100/50 p-2 rounded-full transition-all duration-200"
        aria-label="Clear all filters"
      >
        <X className="h-5 w-5" />
      </Button>
    )}
  </div>
  {showFilters && (
    <CardContent
      id="filter-content"
      className="px-8 py-6 space-y-6 bg-transparent animate-in slide-in-from-top-10 fade-in-20 duration-500"
    >
      <p className="text-base font-medium text-gray-600 tracking-wide">
        Tailor your search to find the best pharmacies
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="state-filter"
            className="text-sm font-semibold text-primary uppercase tracking-wider"
          >
            State
          </Label>
          <Select
            inputId="state-filter"
            options={states}
            onChange={(selected) => {
              const newState = selected?.value || '';
              setFilterState(newState);
              updateLgas(newState);
              if (!newState) {
                setFilterLga('');
                setFilterWard('');
                setLgas([]);
                setWards([]);
              }
              if (searchTerm) handleSearch(searchTerm);
            }}
            value={states.find((option) => option.value === filterState) || null}
            placeholder="Select a state"
            isClearable
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...provided,
                border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                boxShadow: state.isFocused
                  ? '0 0 10px rgba(59,130,246,0.3)'
                  : 'none',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '1rem',
                padding: '0.25rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(59,130,246,0.5)',
                  boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                },
              }),
              menu: (provided) => ({
                ...provided,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(209,213,219,0.5)',
                borderRadius: '1rem',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              }),
            }}
            className="text-base"
            aria-label="Select state"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="lga-filter"
            className="text-sm font-semibold text-primary uppercase tracking-wider"
          >
            LGA
          </Label>
          <Select
            inputId="lga-filter"
            options={lgas}
            onChange={(selected) => {
              const newLga = selected?.value || '';
              setFilterLga(newLga);
              updateWards(filterState, newLga);
              if (!newLga) {
                setFilterWard('');
                setWards([]);
              }
              if (searchTerm) handleSearch(searchTerm);
            }}
            value={lgas.find((option) => option.value === filterLga) || null}
            placeholder="Select an LGA"
            isClearable
            isDisabled={!filterState}
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...provided,
                border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                boxShadow: state.isFocused
                  ? '0 0 10px rgba(59,130,246,0.3)'
                  : 'none',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '1rem',
                padding: '0.25rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(59,130,246,0.5)',
                  boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                },
              }),
              menu: (provided) => ({
                ...provided,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(209,213,219,0.5)',
                borderRadius: '1rem',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              }),
            }}
            className="text-base"
            aria-label="Select LGA"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="ward-filter"
            className="text-sm font-semibold text-primary uppercase tracking-wider"
          >
            Ward
          </Label>
          <Select
            inputId="ward-filter"
            options={wards}
            onChange={(selected) => {
              setFilterWard(selected?.value || '');
              if (searchTerm) handleSearch(searchTerm);
            }}
            value={wards.find((option) => option.value === filterWard) || null}
            placeholder="Select a ward"
            isClearable
            isDisabled={!filterLga}
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...provided,
                border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                boxShadow: state.isFocused
                  ? '0 0 10px rgba(59,130,246,0.3)'
                  : 'none',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '1rem',
                padding: '0.25rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(59,130,246,0.5)',
                  boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                },
              }),
              menu: (provided) => ({
                ...provided,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(209,213,219,0.5)',
                borderRadius: '1rem',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              }),
            }}
            className="text-base"
            aria-label="Select ward"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-primary uppercase tracking-wider">
          Sort By
        </Label>
        <div className="flex gap-4 pt-2">
          {['cheapest', 'closest'].map((value) => (
            <Button
              key={value}
              variant={sortBy === value ? 'default' : 'outline'}
              onClick={() => {
                setSortBy(value);
                if (searchTerm) handleSearch(searchTerm);
              }}
              className={cn(
                'h-10 px-6 text-sm font-semibold rounded-full transition-all duration-300',
                sortBy === value
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'border-gray-200 text-gray-700 hover:bg-primary/10 hover:border-primary/50'
              )}
              aria-label={`Sort by ${value}`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-red-100/50 hover:border-red-500/50 hover:text-red-600 transition-all duration-300"
          aria-label="Clear all filters"
        >
          Clear
        </Button>
        <Button
          onClick={() => handleSearch(searchTerm)}
          className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
        >
          Apply Filters
        </Button>
      </div>
    </CardContent>
  )}
</Card>

{/* Error Message */}
{error && (
  <Card className="shadow-md border border-red-100/50 rounded-2xl bg-red-50/90 backdrop-blur-sm p-4 mt-6">
    <p className="text-red-600 text-base font-medium" aria-live="polite">
      {error}
    </p>
  </Card>
)}

{/* Search Results */}
<div className="space-y-8">
  {results.length === 0 && !error && searchTerm ? (
    <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <p className="text-gray-600 text-xl font-medium">
        No medications found for "{searchTerm}"
      </p>
    </Card>
  ) : results.length === 0 && !searchTerm ? (
    <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <p className="text-gray-600 text-xl font-medium">
        Enter a medication name to compare pharmacies
      </p>
    </Card>
  ) : (
    results.map((med) => (
      <Card
        key={med.id}
        className="relative shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
      >
        {/* Decorative Corner Accent */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex-1">
            <CardTitle className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
              {med.displayName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {med.prescriptionRequired && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
                  Prescription Needed
                </span>
              )}
              <span className="text-sm text-gray-500">
                {med.genericName || 'Generic N/A'}
              </span>
            </div>
                      <div className="mb-6">
            <p className="text-gray-600 text-base">
              <strong className="font-semibold text-gray-800">NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
            </p>
          </div>
          </div>
          {med.imageUrl && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
              <img
                src={med.imageUrl}
                alt={med.displayName}
                className="w-full h-full object-cover rounded-2xl border border-gray-200/50 shadow-md transition-transform duration-300 hover:scale-110"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">

          <h3 className="text-xl font-bold text-primary mb-4">Compare Pharmacies</h3>
          {med.availability && med.availability.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 text-sm font-semibold text-gray-700">
                    <th className="p-4 rounded-tl-xl">Pharmacy</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4 rounded-tr-xl">Action</th>
                  </tr>
                </thead>
              <tbody>
                {med.availability.map((avail, index) => {
                  const isCheapest = avail.price === Math.min(...med.availability.map(a => a.price));
                  const isClosest = avail.distance_km === Math.min(...med.availability.filter(a => a.distance_km !== null).map(a => a.distance_km));
                  return (
                    <tr
                      key={index}
                      className="border-t border-gray-100/50 hover:bg-primary/10 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">{avail.pharmacyName}</p>
                        {avail.address && (
                          <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">{avail.address}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-800">₦{avail.price.toLocaleString()}</span>
                          {isCheapest && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-green-600 bg-green-100 rounded-full animate-bounce">
                              Cheapest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {avail.distance_km !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base text-gray-600">{avail.distance_km.toFixed(1)} km</span>
                            {isClosest && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-bounce">
                                Closest
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-base">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.displayName)}
                          disabled={isInCart(med.id, avail.pharmacyId) || isAddingToCart[`${med.id}-${avail.pharmacyId}`]}
                          className={cn(
                            'h-10 px-5 text-sm font-semibold rounded-full transition-all duration-300',
                            isInCart(med.id, avail.pharmacyId)
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse'
                          )}
                          aria-label={isInCart(med.id, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                        >
                          {isAddingToCart[`${med.id}-${avail.pharmacyId}`] ? (
                            <svg
                              className="animate-spin h-5 w-5 mr-2"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                          )}
                          {isInCart(med.id, avail.pharmacyId) ? 'Added' : 'Add to Cart'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-base italic p-4">
              Not available at any verified pharmacy
            </p>
          )}
        </CardContent>
      </Card>
    ))
  )}
</div>
      </div>
    );
  }