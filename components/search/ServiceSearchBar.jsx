'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Loader2, Search, SearchX } from 'lucide-react';
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
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isAddingToOrder, setIsAddingToOrder] = useState({});
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItemDetails, setLastAddedItemDetails] = useState(null);
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
  const { orders, fetchOrders, addToOrder, guestId } = useOrder();

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
          toast.error(`Unable to fetch location. Showing all ${serviceType === 'medication' ? 'pharmacies' : 'labs'}.`, {
            duration: 4000,
          });
        }
      );
    }
  }, [serviceType]);

  useEffect(() => {
    if (Array.isArray(orders)) {
      setOrderItems(orders.flatMap((order) => order.providers?.flatMap((p) => p.items) || []));
    } else {
      setOrderItems([]);
    }
  }, [orders]);

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
      toast.error('Failed to load suggestions. Please try again.', { duration: 4000 });
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = async (term) => {
    try {
      setError(null);
      setIsLoadingResults(true);
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
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleSelectService = async (service) => {
    setSearchTerm(service.displayName);
    setShowDropdown(false);
    setFocusedSuggestionIndex(-1);
    try {
      setError(null);
      setIsLoadingResults(true);
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
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      setResults([]);
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleAddToOrder = async (serviceId, providerId, serviceName, quantity) => {
    const itemKey = `${serviceId}-${providerId}`;
    try {
      if (!serviceId || isNaN(parseInt(serviceId))) {
        throw new Error('Invalid service ID');
      }
      if (!providerId || isNaN(parseInt(providerId))) {
        console.error('Invalid providerId received:', providerId);
        throw new Error('Invalid provider ID');
      }
      const finalQuantity = serviceType === 'medication' ? (quantity || 1) : 1;
      console.log('Adding to order:', { serviceId, providerId, serviceName, quantity: finalQuantity, serviceType });
      setIsAddingToOrder((prev) => ({ ...prev, [itemKey]: true }));
      setOrderItems((prev) => [
        ...prev,
        {
          serviceId: serviceId,
          providerId: providerId,
          quantity: finalQuantity,
          service: { displayName: serviceName },
        },
      ]);
      const result = await addToOrder({
        serviceId: serviceId,
        providerId: providerId,
        type: serviceType,
        quantity: finalQuantity,
      });
      console.log('Add to order response:', { orderItem: result.orderItem, orderTotalPrice: result.order.totalPrice });
      setLastAddedItem(serviceName);
      setLastAddedItemDetails({
        providerId: result.orderItem.providerId,
        serviceId: result.orderItem.serviceId,
        itemId: result.orderItem.id,
        serviceType,
      });
      await fetchOrders();
      setOpenOrderDialog(true);
      toast.success(`Added ${serviceName} to your order!`, {
        action: {
          label: 'View Order',
          onClick: () => window.location.href = '/order',
        },
        duration: 4000,
      });
    } catch (err) {
      console.error('Add to order error:', err);
      toast.error(`Error: ${err.message}`, { duration: 4000 });
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-lg transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
          <div className="flex-1 min-w-0">
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
                  if (searchTerm !== '' || results.length > 0 || suggestions.length > 0) {
                    setSearchTerm('');
                    setResults([]);
                    setSuggestions([]);
                    toast.info(`Switched to ${value === 'medication' ? 'Medications' : value === 'diagnostic' ? 'Diagnostic Tests' : 'Diagnostic Packages'}. Please enter a new search term.`, {
                      duration: 4000,
                    });
                  }
                  if (filterHomeCollection) setFilterHomeCollection(false);
                }
              }}
            >
              <SelectTrigger
                className="mt-2 h-12 text-base font-medium rounded-2xl border border-[#1ABA7F]/20 bg-white/95 text-gray-900 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                aria-label="Select service type for search"
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
          <div className="flex-[2] min-w-0">
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
              className="border-[#1ABA7F]/20 rounded-2xl text-gray-900 bg-white/95 shadow-xl h-12"
            />
          </div>
        </div>
      </Card>
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          className="h-12 px-4 rounded-full bg-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/30 hover:text-[#1ABA7F] transition-all duration-300"
          onClick={() => setShowFilters(!showFilters)}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
        >
          <Filter className="h-5 w-5 mr-2" aria-hidden="true" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>
      {showFilters && (
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
          className="bg-white/95 rounded-xl border-[#1ABA7F]/20 shadow-md backdrop-blur-lg"
        />
      )}
      <ErrorMessage error={error} className="text-red-600 text-center text-lg font-semibold" />
      <div className="space-y-8">
        {isLoadingResults ? (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl text-center py-12 backdrop-blur-lg transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1ABA7F]" aria-hidden="true" />
              <p className="text-xl font-semibold text-[#225F91] ml-3">Loading results...</p>
            </div>
          </Card>
        ) : results.length === 0 && !error && searchTerm ? (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl text-center py-12 backdrop-blur-lg transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <div className="flex flex-col items-center">
              <SearchX className="h-8 w-8 text-[#225F91] mb-2" aria-hidden="true" />
              <p className="text-xl font-semibold text-[#225F91]" role="alert">
                No {serviceType === 'medication' ? 'medications' : serviceType === 'diagnostic' ? 'tests' : 'packages'} found for "{searchTerm}"
              </p>
            </div>
          </Card>
        ) : results.length === 0 && !searchTerm ? (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl text-center py-12 backdrop-blur-lg transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <div className="flex flex-col items-center">
              <Search className="h-8 w-8 text-[#225F91] mb-2" aria-hidden="true" />
              <p className="text-xl font-semibold text-[#225F91]" role="alert">
                Enter a {serviceType === 'medication' ? 'medication' : serviceType === 'diagnostic' ? 'test' : 'package'} name to compare {serviceType === 'medication' ? 'pharmacies' : 'labs'}
              </p>
            </div>
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
      <OrderDialog
        openOrderDialog={openOrderDialog}
        setOpenOrderDialog={setOpenOrderDialog}
        lastAddedItem={lastAddedItem}
        serviceType={serviceType}
        lastAddedItemDetails={lastAddedItemDetails}
        fetchOrders={fetchOrders}
        isEditMode={false}
      />
    </div>
  );
}