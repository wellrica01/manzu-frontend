'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, CheckCircle, ShoppingCart, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Select from 'react-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }


// Custom react-select styles to match Shadcn
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    height: '48px',
    borderRadius: '0.5rem',
    border: `1px solid ${state.isFocused ? '#3b82f6' : '#e5e7eb'}`,
    backgroundColor: '#ffffff', // Explicit white
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

  const fetchCart = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCartItems(data.pharmacies?.flatMap(p => p.items) || []);
    } catch (err) {
      console.error('Fetch cart error:', err);
    }
  };

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

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

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
      await fetchCart();
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
      await fetchCart();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

  const handleAddToCart = async (medicationId, pharmacyId, medicationName) => {
    const quantity = 1;
    try {
      if (!medicationId || !pharmacyId) throw new Error('Invalid medication or pharmacy');
      setIsAddingToCart(true);
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
      await fetchCart();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsAddingToCart(false);
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
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Cart Confirmation Dialog */}
      <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
        <DialogContent className="sm:max-w-md p-6 shadow-lg">
          <DialogHeader>
            <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
            <DialogTitle className="text-2xl font-semibold text-primary text-center mt-2">
              Item Added to Cart
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600">
            <span className="font-medium">{lastAddedItem}</span> has been added to your cart.
          </p>
          <DialogFooter className="mt-6 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/cart" aria-label="View cart">
                View Cart
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Input */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for medications..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-10 h-12 text-base rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              aria-controls="suggestions-list"
            />
            {showDropdown && (
              <div
                ref={dropdownRef}
                id="suggestions-list"
                className="absolute z-20 w-full mt-4 bg-background border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-transform duration-200"
                role="listbox"
              >
                {isLoadingSuggestions ? (
                  <div className="px-4 py-3 flex items-center text-primary">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Loading...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((med, index) => (
                    <div
                      key={med.id}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      className={cn(
                        'px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors duration-200 text-base',
                        index === focusedSuggestionIndex && 'bg-primary/10'
                      )}
                      onClick={() => handleSelectMedication(med)}
                      role="option"
                      aria-selected={index === focusedSuggestionIndex}
                    >
                      {med.displayName}
                    </div>
                  ))
                ) : (
                  searchTerm && (
                    <div className="px-4 py-3 text-gray-500 text-base">
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
<Card className="shadow-md border border-[#e5e7eb] rounded-xl overflow-hidden">
  <div
    className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[#dbeafe] to-[#ffffff] cursor-pointer hover:bg-[#bfdbfe] transition-colors duration-200"
    onClick={() => setShowFilters(!showFilters)}
    role="button"
    aria-expanded={showFilters}
    aria-controls="filter-content"
  >
    <div className="flex items-center gap-2">
      <Filter className="h-5 w-5 text-[#3b82f6]" />
      <span className="text-base font-semibold text-[#3b82f6]">
        {showFilters ? 'Hide Filters' : 'Show Filters'}
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
        className="text-[#dc2626] hover:text-[#b91c1c] p-2"
        aria-label="Clear all filters"
      >
        <X className="h-5 w-5" />
      </Button>
    )}
  </div>
  {showFilters && (
    <CardContent
      id="filter-content"
      className="px-6 py-4 space-y-4 bg-[#ffffff] transition-opacity duration-300 ease-in-out"
    >
      <p className="text-sm font-medium text-[#6b7280]">
        Refine your search by location or sort preference
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="state-filter" className="text-sm font-medium text-[#3b82f6]">
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
            value={states.find(option => option.value === filterState) || null}
            placeholder="Select a state"
            isClearable
            styles={customSelectStyles}
            className="text-sm"
            aria-label="Select state"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lga-filter" className="text-sm font-medium text-[#3b82f6]">
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
            value={lgas.find(option => option.value === filterLga) || null}
            placeholder="Select an LGA"
            isClearable
            isDisabled={!filterState}
            styles={customSelectStyles}
            className="text-sm"
            aria-label="Select LGA"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ward-filter" className="text-sm font-medium text-[#3b82f6]">
          Ward
        </Label>
        <Select
          inputId="ward-filter"
          options={wards}
          onChange={(selected) => {
            setFilterWard(selected?.value || '');
            if (searchTerm) handleSearch(searchTerm);
          }}
          value={wards.find(option => option.value === filterWard) || null}
          placeholder="Select a ward"
          isClearable
          isDisabled={!filterLga}
          styles={customSelectStyles}
          className="text-sm"
          aria-label="Select ward"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium text-[#3b82f6]">Sort By</Label>
        <RadioGroup
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            if (searchTerm) handleSearch(searchTerm);
          }}
          className="flex flex-wrap gap-4 pt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cheapest" id="cheapest" />
            <Label htmlFor="cheapest" className="text-sm font-medium text-[#374151]">
              Cheapest
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="closest" id="closest" />
            <Label htmlFor="closest" className="text-sm font-medium text-[#374151]">
              Closest
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="h-10 px-4 text-sm font-medium border-[#e5e7eb] hover:bg-[#f9fafb]"
          aria-label="Clear all filters"
        >
          Clear
        </Button>
        <Button
          onClick={() => handleSearch(searchTerm)}
          className="h-10 px-4 text-sm font-medium bg-[#3b82f6] hover:bg-[#2563eb]"
        >
          Apply
        </Button>
      </div>
    </CardContent>
  )}
</Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-destructive/5 border border-destructive rounded-lg p-4">
          <p className="text-destructive text-base font-medium" aria-live="polite">
            {error}
          </p>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {results.length === 0 && !error && searchTerm ? (
          <Card className="shadow-lg text-center p-6">
            <p className="text-primary text-base font-medium">
              No medications found for "{searchTerm}"
            </p>
          </Card>
        ) : results.length === 0 && !searchTerm ? (
          <Card className="shadow-lg text-center p-6">
            <p className="text-primary text-base font-medium">
              Enter a medication name to find available pharmacies
            </p>
          </Card>
        ) : (
          results.map((med) => (
            <Card
              key={med.id}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader className="bg-gradient-to-r from-primary/5 to-background">
                <CardTitle className="text-2xl font-semibold text-primary">
                  {med.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  <div className="flex-1">
                    <p className="text-gray-700 text-base">
                      <strong>Generic Name:</strong> {med.genericName || 'N/A'}
                    </p>
                    <p className="text-gray-700 text-base">
                      <strong>NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
                    </p>
                  </div>
                  {med.imageUrl && (
                    <img
                      src={med.imageUrl}
                      alt={med.displayName}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Available at:
                </h3>
                {med.availability && med.availability.length > 0 ? (
                  <div className="space-y-4">
                    {med.availability.map((avail, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors duration-200"
                      >
                        <div className="flex-1">
                          <p className="text-base font-medium text-gray-900">{avail.pharmacyName}</p>
                          <p className="text-sm text-gray-500">{avail.address || 'Address not available'}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-base">Price: ₦{avail.price.toLocaleString()}</p>
                          {avail.distance_km !== null && (
                            <p className="text-base">Distance: ~{avail.distance_km} km</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.displayName)}
                          disabled={isInCart(med.id, avail.pharmacyId) || isAddingToCart}
                          className={cn(
                            'h-12 text-base',
                            isInCart(med.id, avail.pharmacyId) ? 'bg-gray-300 text-gray-500' : 'bg-primary hover:bg-primary/90'
                          )}
                          aria-label={isInCart(med.id, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                        >
                          {isAddingToCart ? (
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <ShoppingCart className="h-5 w-5 mr-2" />
                          )}
                          {isInCart(med.id, avail.pharmacyId) ? 'Added to Cart' : 'Add to Cart'}
                        </Button>
                      </div>
                    ))}
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