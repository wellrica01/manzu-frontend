'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useOrder } from '@/hooks/useOrder';
import SearchInput from './SearchInput';
import FilterControls from './FilterControls';
import ServiceCard from './ServiceCard';
import OrderDialog from './OrderDialog';
import ErrorMessage from '@/components/ErrorMessage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ServiceSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAddingToOrder, setIsAddingToOrder] = useState({});
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItemDetails, setLastAddedItemDetails] = useState(null); // New state for item details
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterHomeCollection, setFilterHomeCollection] = useState(false);
  const [sortBy, setSortBy] = useState('cheapest');
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [serviceType, setServiceType] = useState('medication');

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const { order, fetchOrder, addToOrder, guestId } = useOrder();

  useEffect(() => {
    fetch('/data/full.json')
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setStates(data.map((state) => ({ value: state.state, label: state.state })));
      })
      .catch((err) => {
        console.error('Failed to load geo data:', err);
        toast.error('Failed to load location filters', { duration: 4000 });
      });
  }, []);

  const updateLgas = (state) => {
    if (!geoData) return;
    const stateData = geoData.find((s) => s.state === state);
    setLgas(stateData ? stateData.lgas.map((lga) => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  };

  const updateWards = (state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find((s) => s.state === state);
    const lgaData = stateData?.lgas.find((l) => l.name === lga);
    setWards(lgaData ? lgaData.wards.map((ward) => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  };

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSortBy('cheapest');
    setFilterHomeCollection(false);
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
          toast.error(`Unable to fetch location. Showing all ${serviceType === 'medication' ? 'pharmacies' : 'labs'}.`);
        }
      );
    }
  }, [serviceType]);

  useEffect(() => {
    setOrderItems(order.providers?.flatMap((p) => p.items) || []);
  }, [order]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, serviceType]);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoadingSuggestions(false);
      return;
    }
    try {
      setIsLoadingSuggestions(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/suggestions?q=${encodeURIComponent(query)}&type=${serviceType}`
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      console.log('Suggestions fetched:', data);
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
      const queryParams = new URLSearchParams({ q: term, type: serviceType });
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      if (filterHomeCollection && serviceType !== 'medication') queryParams.append('homeCollection', 'true');
      queryParams.append('sortBy', sortBy);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/services/search?${queryParams.toString()}`;
      console.log('Fetching services from:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to search services');
      const data = await response.json();
      setResults(data);
      setShowDropdown(false);
      setFocusedSuggestionIndex(-1);
      await fetchOrder();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

  const handleSelectService = async (service) => {
    setSearchTerm(service.displayName);
    setShowDropdown(false);
    setFocusedSuggestionIndex(-1);
    try {
      setError(null);
      const queryParams = new URLSearchParams({ serviceId: service.id, type: serviceType });
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      if (filterHomeCollection && serviceType !== 'medication') queryParams.append('homeCollection', 'true');
      queryParams.append('sortBy', sortBy);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/services/search?${queryParams.toString()}`;
      console.log('Fetching services from:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to search services');
      const data = await response.json();
      setResults(data);
      await fetchOrder();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message);
    }
  };

  const handleAddToOrder = async (serviceId, providerId, serviceName, quantity) => {
    const itemKey = `${serviceId}-${providerId}`;
    try {
      // Validate serviceId and providerId
      if (!serviceId || isNaN(parseInt(serviceId))) {
        throw new Error('Invalid service ID');
      }
      if (!providerId || isNaN(parseInt(providerId))) {
        console.error('Invalid providerId received:', providerId);
        throw new Error('Invalid provider ID');
      }
      console.log('Adding to order:', { serviceId, providerId, serviceName, quantity, serviceType });
      setIsAddingToOrder((prev) => ({ ...prev, [itemKey]: true }));
      setOrderItems((prev) => [
        ...prev,
        {
          serviceId: serviceId,
          providerId: providerId,
          quantity: quantity || 1,
          service: { displayName: serviceName },
        },
      ]);
      const result = await addToOrder({
        serviceId: serviceId,
        providerId: providerId,
        type: serviceType,
        quantity: quantity || 1,
      });
      setLastAddedItem(serviceName);
      setLastAddedItemDetails({
        providerId: result.orderItem.providerId,
        serviceId: result.orderItem.serviceId,
        itemId: result.orderItem.id,
        serviceType,
      });
      await fetchOrder();
      setOpenOrderDialog(true);
    } catch (err) {
      console.error('Add to order error:', err);
      toast.error(`Error: ${err.message}`);
      setOrderItems((prev) =>
        prev.filter((item) => !(item.serviceId === serviceId && item.providerId === providerId))
      );
    } finally {
      setIsAddingToOrder((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  const isInOrder = (serviceId, providerId) => {
    if (!Array.isArray(orderItems)) return false;
    return orderItems.some(
      (item) => item.serviceId === serviceId && item.providerId === providerId
    );
  };

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OrderDialog
        openOrderDialog={openOrderDialog}
        setOpenOrderDialog={setOpenOrderDialog}
        lastAddedItem={lastAddedItem}
        serviceType={serviceType}
        lastAddedItemDetails={lastAddedItemDetails} // Pass the new prop
      />
      <div>
        <label
          htmlFor="serviceType"
          className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
        >
          Service Type
        </label>
        <Select
          id="serviceType"
          value={serviceType}
          onValueChange={(value) => {
            console.log('Select value changed:', value);
            if (value !== serviceType) {
              setServiceType(value);
              if (searchTerm !== '') setSearchTerm('');
              if (results.length > 0) setResults([]);
              if (suggestions.length > 0) setSuggestions([]);
              if (filterHomeCollection) setFilterHomeCollection(false);
            }
          }}
        >
          <SelectTrigger
            className="mt-2 h-14 text-lg font-medium rounded-2xl border border-[#1ABA7F]/20 bg-white/95 text-gray-900 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
          >
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="medication">Medication</SelectItem>
            <SelectItem value="diagnostic">Diagnostic Test</SelectItem>
            <SelectItem value="diagnostic_package">Diagnostic Package</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
        handleSelectService={handleSelectService}
        dropdownRef={dropdownRef}
        inputRef={inputRef}
        suggestionRefs={suggestionRefs}
        serviceType={serviceType}
        className="border-[#1ABA7F]/20 rounded-2xl text-gray-900 bg-white/95 shadow-xl"
      />
      <FilterControls
        filterState={filterState}
        setFilterState={setFilterState}
        filterLga={filterLga}
        setFilterLga={setFilterLga}
        filterWard={filterWard}
        setFilterWard={setFilterWard}
        filterHomeCollection={filterHomeCollection}
        setFilterHomeCollection={setFilterHomeCollection}
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
        serviceType={serviceType}
        className="bg-white/95 rounded-xl border-[#1ABA7F]/20 shadow-md"
      />
      <ErrorMessage error={error} className="text-red-600 text-center text-lg font-semibold" />
      <div className="space-y-8">
        {results.length === 0 && !error && searchTerm ? (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl text-center py-12 backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-16 h-16 bg-transparent border-t-4 border-l-4 border-[#1ABA7F]/20 rounded-br-3xl" />
            <p className="text-gray-900 text-xl font-semibold">
              No {serviceType === 'medication' ? 'medications' : serviceType === 'diagnostic' ? 'tests' : 'packages'} found for "{searchTerm}"
            </p>
          </Card>
        ) : results.length === 0 && !searchTerm ? (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl text-center py-12 backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-16 h-16 bg-transparent border-t-4 border-l-4 border-[#1ABA7F]/20 rounded-br-3xl" />
            <p className="text-gray-900 text-xl font-semibold">
              Enter a {serviceType === 'medication' ? 'medication' : serviceType === 'diagnostic' ? 'test' : 'package'} name to compare {serviceType === 'medication' ? 'pharmacies' : 'labs'}
            </p>
          </Card>
        ) : (
          results.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              serviceType={serviceType}
              handleAddToOrder={handleAddToOrder}
              isInOrder={isInOrder}
              isAddingToOrder={isAddingToOrder}
            />
          ))
        )}
      </div>
    </div>
  );
}