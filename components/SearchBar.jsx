'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react'; // Assuming lucide-react for icons
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

  // Fetch user location
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
      setCartItems(data.items || []);
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

  const handleSelectMedication = async (med) => {
    setSearchTerm(med.name);
    setShowDropdown(false);
    setFocusedSuggestionIndex(-1);
    try {
      setError(null);
      const queryParams = new URLSearchParams({ q: med.name });
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

  const handleSearch = async () => {
    try {
      setError(null);
      const queryParams = new URLSearchParams({ q: searchTerm });
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
    return cartItems.some(
      (item) =>
        item.pharmacyMedicationMedicationId === medicationId &&
        item.pharmacyMedicationPharmacyId === pharmacyId
    );
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
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

  // Close dropdown when clicking outside
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
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Search Input and Button */}
      <div className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medications..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="pl-10 py-2 text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="suggestions-list"
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="suggestions-list"
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-all duration-200 ease-in-out"
              role="listbox"
            >
              {isLoadingSuggestions ? (
                <div className="px-4 py-3 flex items-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((med, index) => (
                  <div
                    key={med.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    className={`px-4 py-2 text-gray-800 cursor-pointer hover:bg-teal-50 transition-colors duration-150 ${
                      index === focusedSuggestionIndex ? 'bg-teal-100' : ''
                    }`}
                    onClick={() => handleSelectMedication(med)}
                    role="option"
                    aria-selected={index === focusedSuggestionIndex}
                  >
                    {med.name}
                  </div>
                ))
              ) : (
                searchTerm && (
                  <div className="px-4 py-3 text-gray-500 italic">
                    No medications found for &quot;{searchTerm}&quot;
                  </div>
                )
              )}
            </div>
          )}
        </div>
        <Button
          onClick={handleSearch}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
          aria-label="Search medications"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {results.length === 0 && !error && searchTerm ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">
              No medications found for &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : results.length === 0 && !searchTerm ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">
              Enter a medication name to find available pharmacies
            </p>
          </div>
        ) : (
          results.map((med) => (
            <Card
              key={med.id}
              className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg"
            >
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-teal-800">
                  {med.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Generic Name:</strong> {med.genericName || 'N/A'}
                  </p>
                  <p>
                    <strong>NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
                  </p>
                </div>
                {med.imageUrl && (
                  <img
                    src={med.imageUrl}
                    alt={med.name}
                    className="w-24 h-24 object-cover my-4 rounded-md border border-gray-200"
                  />
                )}
                <h3 className="font-semibold text-teal-700 mt-4 mb-2">
                  Available at:
                </h3>
                <ul className="space-y-3">
                  {med.availability && med.availability.length > 0 ? (
                    med.availability.map((avail, index) => (
                      <li
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <span className="text-gray-700">
                          {avail.pharmacyName}: {avail.stock} in stock, ₦
                          {avail.price.toLocaleString()}
                          {avail.distance_km !== null
                            ? ` (~${avail.distance_km} km)`
                            : ''}
                        </span>
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId)}
                          disabled={isInCart(med.id, avail.pharmacyId)}
                          className={`mt-2 sm:mt-0 text-sm py-1 px-3 rounded-md font-medium transition-all duration-200 ${
                            isInCart(med.id, avail.pharmacyId)
                              ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                          aria-label={`Add ${med.name} from ${avail.pharmacyName} to cart`}
                        >
                          {isInCart(med.id, avail.pharmacyId)
                            ? 'Added to Cart'
                            : 'Add to Cart'}
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">
                      Not available at any pharmacy
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