'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Loader2, ShoppingCart, CheckCircle, Filter, X } from 'lucide-react';
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


    // Load geo data for filters
  useEffect(() => {
    fetch('/data/full.json')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setStates(data.map(state => ({
          value: state.state,
          label: state.state,
        })));
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
    setLgas(stateData ? stateData.lgas.map(lga => ({
      value: lga.name,
      label: lga.name,
    })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  };

  // Update wards when LGA changes
  const updateWards = (state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({
      value: ward.name,
      label: ward.name,
    })) : []);
    setFilterWard('');
  };
 
    // ClearFilters
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
          toast.error('Unable to fetch location. Showing all pharmacies.', { duration: 4000 });
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
      toast.error('Failed to load suggestions. Please try again.', { duration: 4000 });
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
      toast.error(err.message, { duration: 4000 });
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
      toast.error(err.message, { duration: 4000 });
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
      // Track cart addition (placeholder)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', { medicationId, pharmacyId });
      }
      await fetchCart();
    } catch (err) {
      toast.error(`Error: ${err.message}`, { duration: 4000 });
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Cart Confirmation Dialog */}
      <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
        <DialogContent className="sm:max-w-md">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              Item Added to Cart
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground">
              <span className="font-medium">{lastAddedItem}</span> has been added to your cart.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              className="w-full sm:w-auto"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/cart" aria-label="View cart">
                View Cart
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Input */}
      <div className="relative max-w-full sm:max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medications..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="pl-10 py-2 text-sm w-full"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="suggestions-list"
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="suggestions-list"
              className="absolute z-20 w-full mt-1 card max-h-48 overflow-y-auto shadow-lg"
              role="listbox"
            >
              {isLoadingSuggestions ? (
                <div className="px-3 py-2 flex items-center text-primary">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((med, index) => (
                  <div
                    key={med.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    className={cn(
                      'px-3 py-2 cursor-pointer hover:bg-primary/10 transition-colors duration-150 text-sm',
                      index === focusedSuggestionIndex && 'bg-primary/20'
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
                  <div className="px-3 py-2 text-muted-foreground italic text-sm">
                    No medications found for "{searchTerm}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

    {/* Filter Controls */}
      <Card className="shadow-md border-border rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-background cursor-pointer hover:bg-primary/10 transition-colors duration-200"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2" />
            <span className="text-sm sm:text-base font-semibold text-primary">
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
              className="text-destructive hover:text-destructive/80 p-1"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
        {showFilters && (
          <CardContent className="p-4 sm:p-6 space-y-6 transition-all duration-300 ease-in-out">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Narrow your search by location or sort results
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state-filter" className="text-primary font-medium text-sm">
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
                  isClearable={true}
                  className="text-sm"
                  aria-label="Select state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga-filter" className="text-primary font-medium text-sm">
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
                  isClearable={true}
                  isDisabled={!filterState}
                  className="text-sm"
                  aria-label="Select LGA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward-filter" className="text-primary font-medium text-sm">
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
                  isClearable={true}
                  isDisabled={!filterLga}
                  className="text-sm"
                  aria-label="Select ward"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-medium text-sm">Sort By</Label>
              <RadioGroup
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  if (searchTerm) handleSearch(searchTerm);
                }}
                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheapest" id="cheapest" />
                  <Label htmlFor="cheapest" className="text-sm">
                    Cheapest
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="closest" id="closest" />
                  <Label htmlFor="closest" className="text-sm">
                    Closest
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="text-sm"
                aria-label="Clear all filters"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => handleSearch(searchTerm)}
                className="text-sm bg-primary hover:bg-primary/90"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <div className="card bg-destructive/10 border-l-4 border-destructive p-3">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {results.length === 0 && !error && searchTerm ? (
          <div className="card text-center py-8">
            <p className="text-primary text-sm font-medium">
              No medications found for "{searchTerm}"
            </p>
          </div>
        ) : results.length === 0 && !searchTerm ? (
          <div className="card text-center py-8">
            <p className="text-primary text-sm font-medium">
              Enter a medication name to find available pharmacies
            </p>
          </div>
        ) : (
          results.map((med, index) => (
            <Card
              key={med.id}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-xl font-semibold text-primary">
                  {med.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-foreground text-sm">
                      <strong>Generic Name:</strong> {med.genericName || 'N/A'}
                    </p>
                    <p className="text-foreground text-sm">
                      <strong>NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
                    </p>
                  </div>
                  {med.imageUrl && (
                    <img
                      src={med.imageUrl}
                      alt={med.displayName}
                      className="w-24 h-24 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-primary text-base mb-3">
                  Available at:
                </h3>
                <ul className="space-y-3">
                  {med.availability && med.availability.length > 0 ? (
                    med.availability.map((avail, index) => (
                      <li
                        key={index}
                        className="card bg-primary/5 p-3 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                      >
                        <div className="flex flex-col sm:flex-row gap-3 text-foreground text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{avail.pharmacyName}</span>
                            <p className="text-xs text-muted-foreground">{avail.address || 'Address not available'}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs">Price: ₦{avail.price.toLocaleString()}</p>
                            {avail.distance_km !== null && (
                              <p className="text-xs">Distance: ~{avail.distance_km} km</p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.displayName)}
                          disabled={isInCart(med.id, avail.pharmacyId) || isAddingToCart}
                          className={cn(
                            'mt-3 w-full sm:w-auto text-sm',
                            isInCart(med.id, avail.pharmacyId) ? 'bg-muted text-muted-foreground' : ''
                          )}
                          aria-label={isInCart(med.id, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                        >
                          {isAddingToCart ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 mr-2" />
                          )}
                          {isInCart(med.id, avail.pharmacyId) ? 'Added to Cart' : 'Add to Cart'}
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic text-sm p-3">
                      Not available at any verified pharmacy
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}