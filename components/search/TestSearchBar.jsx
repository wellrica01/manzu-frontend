'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useBooking } from '@/hooks/useBooking';
import SearchInput from './SearchInput';
import FilterControls from './FilterControls';
const TestCard = dynamic(() => import('./TestCard'), { ssr: false });
import BookingDialog from './BookingDialog';
import ErrorMessage from '@/components/ErrorMessage';

export default function TestSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [bookingItems, setBookingItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAddingToBooking, setIsAddingToBooking] = useState({});
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
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
  const { bookings, fetchBookings, guestId } = useBooking();

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

  const updateLgas = (state) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData ? stateData.lgas.map(lga => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  };

  const updateWards = (state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  };

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
          toast.error('Unable to fetch location. Showing all labs.');
        }
      );
    }
  }, []);

  useEffect(() => {
    setBookingItems(bookings.labs?.flatMap(l => l.items) || []);
  }, [bookings]);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-suggestions?q=${encodeURIComponent(query)}`);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test/tests?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
      await fetchBookings();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

  const handleSelectTest = async (test) => {
    setSearchTerm(test.displayName);
    setShowDropdown(false);
    setFocusedSuggestionIndex(-1);
    try {
      setError(null);
      const queryParams = new URLSearchParams({ testId: test.id });
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      queryParams.append('sortBy', sortBy);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test/tests?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      await fetchBookings();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

  const handleAddToBooking = async (testId, labId, testName) => {
    const quantity = 1;
    const itemKey = `${testId}-${labId}`;
    try {
      if (!testId || !labId) throw new Error('Invalid test or lab');
      setIsAddingToBooking(prev => ({ ...prev, [itemKey]: true }));
      setBookingItems(prev => [
        ...prev,
        {
          labTestTestId: testId,
          labTestLabId: labId,
          quantity,
          test: { displayName: testName },
        },
      ]);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test/bookings/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ testId, labId, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to booking');
      }
      setLastAddedItem(testName);
      setOpenBookingDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_booking', { testId, labId });
      }
      await fetchBookings();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setBookingItems(prev => prev.filter(item => 
        !(item.labTestTestId === testId && item.labTestLabId === labId)
      ));
    } finally {
      setIsAddingToBooking(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const isInBooking = (testId, labId) => {
    if (!Array.isArray(bookingItems)) return false;
    return bookingItems.some(
      (item) =>
        item.labTestTestId === testId &&
        item.labTestLabId === labId
    );
  };

  return (
    <div className="space-y-6 p-6">
      <BookingDialog
        openBookingDialog={openBookingDialog}
        setOpenBookingDialog={setOpenBookingDialog}
        lastAddedItem={lastAddedItem}
      />
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        setIsLoadingSuggestions={setIsLoadingSuggestions}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        focusedSuggestionIndex={focusedSuggestionIndex}
        setFocusedSuggestionIndex={setFocusedSuggestionIndex}
        handleSearch={handleSearch}
        handleSelectMedication={handleSelectTest}
        dropdownRef={dropdownRef}
        inputRef={inputRef}
        suggestionRefs={suggestionRefs}
      />
      <FilterControls
        filterState={filterState}
        setFilterState={setFilterState}
        filterLga={filterLga}
        setFilterLga={setFilterLga}
        filterWard={filterWard}
        setFilterWard={setFilterWard}
        sortBy={sortBy}
        setSortBy={setSortBy}
        states={states}
        lgas={lgas}
        wards={wards}
        geoData={geoData}
        updateLgas={updateLgas}
        updateWards={updateWards}
        clearFilters={clearFilters}
        handleSearch={handleSearch}
        searchTerm={searchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      <ErrorMessage error={error} />
      <div className="space-y-8">
        {results.length === 0 && !error && searchTerm ? (
          <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <p className="text-gray-600 text-xl font-medium">
              No tests found for "{searchTerm}"
            </p>
          </Card>
        ) : results.length === 0 && !searchTerm ? (
          <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <p className="text-gray-600 text-xl font-medium">
              Enter a test name to compare labs
            </p>
          </Card>
        ) : (
          results.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              handleAddToBooking={handleAddToBooking}
              isInBooking={isInBooking}
              isAddingToBooking={isAddingToBooking}
            />
          ))
        )}
      </div>
    </div>
  );
}