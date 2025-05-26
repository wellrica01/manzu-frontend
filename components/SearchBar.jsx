'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ShoppingCart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to fetch location; showing all pharmacies');
        }
      );
    }
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
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
      const response = await fetch(`http://localhost:5000/api/medication-suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
      setShowDropdown(true);
      setFocusedSuggestionIndex(-1);
    } catch (err) {
      console.error('Fetch suggestions error:', err);
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
      const response = await fetch(`http://localhost:5000/api/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setResults(data);
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
      await fetchCart();
    } catch (err) {
      setError(err.message);
      setResults([]);
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
      const response = await fetch(`http://localhost:5000/api/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setResults(data);
      await fetchCart();
    } catch (err) {
      setError(err.message);
      setResults([]);
    }
  };

  const handleAddToCart = async (medicationId, pharmacyId) => {
    const quantity = 1;
    try {
      if (!medicationId || !pharmacyId) {
        throw new Error('Invalid medication or pharmacy');
      }
      const response = await fetch('http://localhost:5000/api/cart/add', {
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
      alert('Added to cart!');
      await fetchCart();
    } catch (err) {
      alert(`Error: ${err.message}`);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Search Input */}
      <div className="relative max-w-lg mx-auto fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medications..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="pl-10 py-3 w-full"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="suggestions-list"
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="suggestions-list"
              className="absolute z-20 w-full mt-2 card max-h-60 overflow-y-auto"
              role="listbox"
            >
              {isLoadingSuggestions ? (
                <div className="px-4 py-3 flex items-center text-primary">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((med, index) => (
                  <div
                    key={med.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    className={`px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors duration-150 ${
                      index === focusedSuggestionIndex ? 'bg-primary/20' : ''
                    }`}
                    onClick={() => handleSelectMedication(med)}
                    role="option"
                    aria-selected={index === focusedSuggestionIndex}
                  >
                    {med.displayName}
                  </div>
                ))
              ) : (
                searchTerm && (
                  <div className="px-4 py-3 text-muted-foreground italic">
                    No medications found for "{searchTerm}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 fade-in">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {results.length === 0 && !error && searchTerm ? (
          <div className="card text-center py-10 fade-in">
            <p className="text-primary text-lg font-medium">
              No medications found for "{searchTerm}"
            </p>
          </div>
        ) : results.length === 0 && !searchTerm ? (
          <div className="card text-center py-10 fade-in">
            <p className="text-primary text-lg font-medium">
              Enter a medication name to find available pharmacies
            </p>
          </div>
        ) : (
          results.map((med, index) => (
            <Card
              key={med.id}
              className="card card-hover overflow-hidden fade-in"
              style={{ animationDelay: `${0.2 * index}s` }}
            >
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary">
                  {med.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-foreground">
                      <strong>Generic Name:</strong> {med.genericName || 'N/A'}
                    </p>
                    <p className="text-foreground">
                      <strong>NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
                    </p>
                  </div>
                  {med.imageUrl && (
                    <img
                      src={med.imageUrl}
                      alt={med.displayName}
                      className="w-40 h-40 object-cover rounded-lg border border-border self-center justify-self-end"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-primary text-lg mb-4">
                  Available at:
                </h3>
                <ul className="space-y-4">
                  {med.availability && med.availability.length > 0 ? (
                    med.availability.map((avail, index) => (
                      <li
                        key={index}
                        className="card bg-primary/5 p-4 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-foreground">
                          <div>
                            <span className="font-medium text-lg">{avail.pharmacyName}</span>
                            <p className="text-sm text-muted-foreground">{avail.address || 'Address not available'}</p>
                          </div>
                          <div className="text-sm">
                            <p>Price: ₦{avail.price.toLocaleString()}</p>
                            {avail.distance_km !== null && (
                              <p>Distance: ~{avail.distance_km} km</p>
                            )}
                          </div>
                          <div className="text-sm">
                            <p>Best Deal: {(1 - avail.score).toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">(Lower price & closer is better)</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId)}
                          disabled={isInCart(med.id, avail.pharmacyId)}
                          className={isInCart(med.id, avail.pharmacyId) ? 'bg-muted text-muted-foreground mt-4' : 'mt-4'}
                        >
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          {isInCart(med.id, avail.pharmacyId) ? 'Added to Cart' : 'Add to Cart'}
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic p-4">
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