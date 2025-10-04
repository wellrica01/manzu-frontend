"use client";
import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, DollarSign, Navigation, Clock, Check, Loader2, Award, ShoppingCart, TrendingDown, Trash2 } from 'lucide-react';

// Constants
const SORT_OPTIONS = {
  DEFAULT: 'default',
  CHEAPEST: 'cheapest',
  NEAREST: 'nearest'
};

const ERROR_MESSAGES = {
  ADD_FAILED: 'Failed to add medications to cart',
  REMOVE_FAILED: 'Failed to remove item from cart',
  NO_PRESCRIPTION: 'Prescription information not found',
  NETWORK_ERROR: 'Network error. Please check your connection.'
};

// Utility functions
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₦0';
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

const formatDistance = (distance) => {
  if (typeof distance !== 'number' || isNaN(distance)) return 'Distance N/A';
  return `${distance.toFixed(1)} km away`;
};

const isValidDistance = (distance) => {
  return typeof distance === 'number' && !isNaN(distance) && distance >= 0;
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const PharmacyRecommendations = ({
  pharmacyRecommendations,
  medications,
  handleAddToCart,
  handleBulkAddWithDuplicateCheck,
  cart,
  isInCart,
  isAddingToCart,
  prescriptionId,
  fetchCart,
  setLastAddedItems,
  setOpenCartDialog,
  userIdentifier,
  guestId,
  state,
  lga,
  ward,
  onRemoveItem,
}) => {
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.DEFAULT);
  const [isBulkAdding, setIsBulkAdding] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  // Memoized getQty with validation
  const getQty = useCallback((medId) => {
    const medication = medications?.find(m => m?.id === medId);
    return medication?.quantity || 1;
  }, [medications]);

  // Calculate lowest prices across pharmacies
  const lowestPrices = useMemo(() => {
    if (!pharmacyRecommendations?.length) return {};
    
    const prices = {};
    pharmacyRecommendations.forEach(pharm => {
      if (!pharm?.meds) return;
      
      pharm.meds.forEach(med => {
        if (!med?.id || typeof med.price !== 'number') return;
        
        if (!prices[med.id] || med.price < prices[med.id]) {
          prices[med.id] = med.price;
        }
      });
    });
    return prices;
  }, [pharmacyRecommendations]);

  // Enrich pharmacies with calculated totals
  const enrichedPharmacies = useMemo(() => {
    if (!pharmacyRecommendations?.length) return [];
    
    return pharmacyRecommendations.map(pharm => {
      const totalPrice = (pharm?.meds || []).reduce((sum, med) => {
        if (!med?.id || typeof med.price !== 'number') return sum;
        const qty = getQty(med.id);
        return sum + (med.price * qty);
      }, 0);
      
      return { 
        ...pharm, 
        trueTotalPrice: totalPrice,
        validDistance: isValidDistance(pharm?.distance_km)
      };
    });
  }, [pharmacyRecommendations, getQty]);

  // Check if pharmacy is open now
  const isPharmacyOpenNow = useCallback((operatingHours) => {
    if (!operatingHours?.length) return false;
    
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const todayHours = operatingHours.find(h => h.dayOfWeek === currentDay);
      if (!todayHours?.openTime || !todayHours?.closeTime) return false;
      
      const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
      
      if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
        return false;
      }
      
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;
      
      return currentTime >= openTime && currentTime <= closeTime;
    } catch (error) {
      console.error('Error checking pharmacy hours:', error);
      return false;
    }
  }, []);

  // Sort and filter pharmacies
  const sortedPharmacyMap = useMemo(() => {
    if (!enrichedPharmacies?.length) return [];

    let filtered = enrichedPharmacies;
    
    // Apply open filter
    if (filterOpen) {
      filtered = enrichedPharmacies.filter(pharm => 
        isPharmacyOpenNow(pharm?.operatingHours)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    
    switch (sortOption) {
      case SORT_OPTIONS.CHEAPEST:
        return sorted.sort((a, b) => a.trueTotalPrice - b.trueTotalPrice);
      
      case SORT_OPTIONS.NEAREST:
        return sorted.sort((a, b) => {
          if (!a.validDistance) return 1;
          if (!b.validDistance) return -1;
          return a.distance_km - b.distance_km;
        });
      
      default: // SORT_OPTIONS.DEFAULT - by med count
        return sorted.sort((a, b) => (b?.medCount || 0) - (a?.medCount || 0));
    }
  }, [enrichedPharmacies, sortOption, filterOpen, isPharmacyOpenNow]);

  // Calculate min values for badges
  const { minDistance, minTotalPrice } = useMemo(() => {
    const validDistances = enrichedPharmacies
      .filter(p => p.validDistance)
      .map(p => p.distance_km);
    
    const prices = enrichedPharmacies
      .map(p => p.trueTotalPrice)
      .filter(p => typeof p === 'number' && !isNaN(p));

    return {
      minDistance: validDistances.length > 0 ? Math.min(...validDistances) : null,
      minTotalPrice: prices.length > 0 ? Math.min(...prices) : null
    };
  }, [enrichedPharmacies]);

  // Handle bulk add with proper error handling
  const handleBulkAdd = useCallback(async (pharmacyId, meds) => {
    if (!prescriptionId) {
      console.error(ERROR_MESSAGES.NO_PRESCRIPTION);
      setApiErrors(prev => ({ ...prev, [pharmacyId]: ERROR_MESSAGES.NO_PRESCRIPTION }));
      return;
    }

    if (!meds?.length) {
      console.warn('No medications to add');
      return;
    }

    setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: true }));
    setApiErrors(prev => ({ ...prev, [pharmacyId]: null }));
    
    try {
      // Check for duplicates if handler provided
      let medsToAdd = meds;
      
      if (handleBulkAddWithDuplicateCheck) {
        const result = await handleBulkAddWithDuplicateCheck(pharmacyId, meds);
        if (!result) {
          // Duplicates found - dialog shown to user
          return;
        }
        medsToAdd = result.meds;
      }

      // Filter out items already in cart from THIS pharmacy
      const itemsToAdd = medsToAdd.filter(med => 
        med?.id && !isInCart(med.id, pharmacyId)
      );
      
      if (itemsToAdd.length === 0) {
        console.info('All items already in cart');
        return;
      }

      const items = itemsToAdd.map(med => ({
        medicationId: med.id,
        pharmacyId,
        quantity: getQty(med.id)
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({
            userIdentifier: userIdentifier || '',
            guestId: guestId || '',
            items,
            prescriptionId,
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || ERROR_MESSAGES.ADD_FAILED);
      }

      const result = await response.json();
      
      // Refresh cart
      if (fetchCart) {
        await fetchCart();
      }

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

      // Set last added items for dialog
      if (setLastAddedItems && result?.orderItems?.length && result?.addedItems?.length) {
        setLastAddedItems(
          result.orderItems.map((orderItem, index) => ({
            id: orderItem.id,
            name: result.addedItems[index].quantity > 1 
              ? `${result.addedItems[index].displayName} x${result.addedItems[index].quantity}` 
              : result.addedItems[index].displayName,
            pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
            quantity: orderItem.quantity
          }))
        );
      }

      if (setOpenCartDialog) {
        setOpenCartDialog(true);
      }

    } catch (error) {
      console.error('Bulk add error:', error);
      
      let errorMessage = ERROR_MESSAGES.ADD_FAILED;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApiErrors(prev => ({ ...prev, [pharmacyId]: errorMessage }));
    } finally {
      setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: false }));
    }
  }, [
    prescriptionId,
    handleBulkAddWithDuplicateCheck,
    isInCart,
    getQty,
    guestId,
    userIdentifier,
    pharmacyRecommendations,
    fetchCart,
    setLastAddedItems,
    setOpenCartDialog
  ]);

  // Debounced bulk add to prevent rapid clicks
  const debouncedBulkAdd = useMemo(
    () => debounce(handleBulkAdd, 300),
    [handleBulkAdd]
  );

  const formatOperatingHours = useCallback((operatingHours) => {
    if (!operatingHours?.length) return null;
    
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const todayHours = operatingHours.find(h => h.dayOfWeek === currentDay);
      
      if (!todayHours?.openTime || !todayHours?.closeTime) return null;
      
      return {
        text: `${todayHours.openTime} - ${todayHours.closeTime}`
      };
    } catch (error) {
      console.error('Error formatting hours:', error);
      return null;
    }
  }, []);

  const getOperatingHoursTextColor = useCallback((operatingHours) => {
    return isPharmacyOpenNow(operatingHours) ? 'text-green-700' : 'text-orange-600';
  }, [isPharmacyOpenNow]);

  // Handle remove with proper error handling
  const handleRemove = useCallback((med, pharm) => {
    if (!cart?.pharmacies || !onRemoveItem) return;

    const cartItem = cart.pharmacies
      .find(p => p?.pharmacy?.id === pharm.pharmacyId)
      ?.items?.find(item => item?.medication?.id === med.id);
    
    if (cartItem) {
      onRemoveItem({
        id: cartItem.id,
        name: med.displayName || 'Unknown Item',
        quantity: cartItem.quantity || 1
      });
    }
  }, [cart, onRemoveItem]);

  const sortFilterOptions = [
    { value: SORT_OPTIONS.DEFAULT, label: 'Best Deal', icon: Award },
    { value: SORT_OPTIONS.CHEAPEST, label: 'Cheapest', icon: DollarSign },
    { value: SORT_OPTIONS.NEAREST, label: 'Nearest', icon: Navigation },
    { value: 'open', label: 'Open Now', icon: Clock, isFilter: true },
  ];

  if (!pharmacyRecommendations) {
    return null;
  }

  return (
    <div className="mb-24 space-y-8">
      {/* Sort & Filter Controls */}
      <div className="space-y-4 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sortFilterOptions.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => option.isFilter ? setFilterOpen(!filterOpen) : setSortOption(option.value)}
              aria-pressed={option.isFilter ? filterOpen : sortOption === option.value}
              aria-label={option.isFilter ? `${option.label} filter` : `Sort by ${option.label}`}
              className={`h-12 rounded-2xl font-black transition-all duration-300 hover:scale-105 border-2 shadow-lg ${
                (option.isFilter ? filterOpen : sortOption === option.value)
                  ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-[#225F91]"
                  : "bg-white text-[#225F91] border-gray-300 hover:border-[#1ABA7F]"
              }`}
            >
              <option.icon className="h-5 w-5 mr-2" strokeWidth={2.5} aria-hidden="true" />
              {option.label}
            </Button>
          ))}
        </div>

        <div className="p-4 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl border-2 border-[#1ABA7F]/20">
          <p className="text-sm font-bold text-gray-700 text-center">
            {filterOpen && <span className="text-green-600">✓ Showing only open pharmacies · </span>}
            {sortOption === SORT_OPTIONS.DEFAULT && 'Sorted by Most Medications Available'}
            {sortOption === SORT_OPTIONS.CHEAPEST && 'Sorted by Cheapest Total Price'}
            {sortOption === SORT_OPTIONS.NEAREST && 'Sorted by Nearest Distance'}
          </p>
        </div>
      </div>

      {/* Pharmacy cards */}
      {sortedPharmacyMap.length === 0 ? (
        <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden p-12">
          <div className="text-center">
            <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-4" strokeWidth={2} aria-hidden="true" />
            <h3 className="text-2xl font-black text-gray-700 mb-3">No pharmacies found</h3>
            <p className="text-gray-600 font-medium">Try adjusting your location filters or clearing all filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 px-2">
          {sortedPharmacyMap.map((pharm) => {
            if (!pharm?.pharmacyId) return null;

            const isNearest = minDistance !== null && pharm.validDistance && pharm.distance_km === minDistance;
            const isCheapest = minTotalPrice !== null && pharm.trueTotalPrice === minTotalPrice;
            const itemsInCart = (pharm.meds || []).filter(med => med?.id && isInCart(med.id, pharm.pharmacyId)).length;
            const itemsNotInCart = (pharm.meds || []).filter(med => med?.id && !isInCart(med.id, pharm.pharmacyId)).length;
            const hasError = apiErrors[pharm.pharmacyId];

            return (
              <Card
                key={pharm.pharmacyId}
                className="relative overflow-hidden bg-white/98 pt-0 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 group"
              >
                {/* Image with badges */}
                {pharm.logoUrl && (
                  <div className="relative w-full h-48 sm:h-64 overflow-hidden">
                    <img
                      src={pharm.logoUrl}
                      alt={`${pharm.pharmacyName || 'Pharmacy'} logo`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    <div className="absolute top-4 left-4 right-4 flex justify-between gap-2">
                      {isNearest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-2 border-white shadow-2xl">
                          <Navigation className="h-4 w-4 mr-1.5" strokeWidth={3} aria-hidden="true" />
                          Nearest
                        </Badge>
                      )}

                      {isCheapest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-2 border-white shadow-2xl ml-auto">
                          <DollarSign className="h-4 w-4 mr-1.5" strokeWidth={3} aria-hidden="true" />
                          Cheapest
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <CardContent className="px-3 sm:px-6 pb-6 pt-1 sm:py-8 relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <div className="relative p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-[#1ABA7F] to-[#225F91] shadow-xl">
                        <HospitalIcon className="h-5 w-5 text-white" strokeWidth={2.5} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-[#225F91] line-clamp-2 mb-2 group-hover:text-[#1ABA7F] transition-colors duration-300">
                        {pharm.pharmacyName || 'Unknown Pharmacy'}
                      </h3>
                      {pharm.address && (
                        <div className="flex items-start gap-3 p-2 sm:p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                          <p className="text-sm text-gray-700 font-semibold line-clamp-2">
                            {pharm.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pharmacy Info */}
                  <div className="space-y-3 mb-6">
                    {pharm.operatingHours && (() => {
                      const formattedHours = formatOperatingHours(pharm.operatingHours);
                      if (!formattedHours) return null;
                      return (
                        <div className="flex items-center gap-3 p-2 sm:p-3 bg-green-50 rounded-xl border border-green-200">
                          <Clock className="h-5 w-5 text-green-600 flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />
                          <div className="flex-1">
                            <span className="text-xs font-black text-gray-600 uppercase tracking-wide block">
                              Opening Hours
                            </span>
                            <span className={`text-xs font-bold ${getOperatingHoursTextColor(pharm.operatingHours)}`}>
                              {formattedHours.text}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-3 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl">
                      <Navigation className="h-5 w-5 text-[#76D1F3] flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      <span className="text-sm font-bold text-gray-700">
                        {formatDistance(pharm.distance_km)}
                      </span>
                    </div>
                  </div>

                  {/* Medications list */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] rounded-full" aria-hidden="true" />
                        Medications
                      </h4>
                      <Badge className={`${(pharm.medCount || 0) === (medications?.length || 0) ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"} font-black px-3 py-1.5`}>
                        {pharm.medCount || 0}/{medications?.length || 0} available
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      {(pharm.meds || []).map(med => {
                        if (!med?.id) return null;

                        const qty = getQty(med.id);
                        const lineTotal = (med.price || 0) * qty;
                        const inCart = isInCart(med.id, pharm.pharmacyId);
                        const isLowestPrice = lowestPrices[med.id] === med.price;
                        const isAddingSingle = isAddingToCart?.[`${med.id}-${pharm.pharmacyId}`];

                        return (
                          <li
                            key={med.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#1ABA7F]/30 transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-bold text-gray-900 flex-1">
                                  {med.displayName || 'Unknown Medication'}
                                </p>
                                {isLowestPrice && (
                                  <Badge className="bg-green-100 text-green-700 border border-green-300 font-black text-xs flex-shrink-0">
                                    <TrendingDown className="h-3 w-3 mr-1" strokeWidth={3} aria-hidden="true" />
                                    Best Price
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                  <span className="px-2 py-1 bg-white rounded-lg border border-gray-300">
                                    Qty: {qty}
                                  </span>
                                  <span>{formatCurrency(med.price)} each</span>
                                </div>
                                <span className="text-sm font-black text-[#225F91]">
                                  {formatCurrency(lineTotal)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex gap-2 w-full sm:w-auto">
                              {inCart ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    disabled
                                    aria-label="Item added to cart"
                                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold text-sm bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed"
                                  >
                                    <Check className="h-4 w-4 mr-2" strokeWidth={3} aria-hidden="true" />
                                    Added
                                  </Button>
                                  <Button
                                    onClick={() => handleRemove(med, pharm)}
                                    variant="outline"
                                    aria-label={`Remove ${med.displayName} from cart`}
                                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300 group"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" strokeWidth={3} aria-hidden="true" />
                                    Remove
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleAddToCart(med.id, pharm.pharmacyId, med.displayName)}
                                  disabled={isAddingSingle}
                                  aria-label={`Add ${med.displayName} to cart`}
                                  className="w-full h-10 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-105 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isAddingSingle ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={3} aria-hidden="true" />
                                      Adding...
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-4 w-4 mr-2" strokeWidth={3} aria-hidden="true" />
                                      Add to Cart
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-2xl border-2 border-[#1ABA7F]/30 mb-6">
                    <span className="text-lg font-black text-gray-700">Total Price</span>
                    <span className="text-xl sm:text-3xl font-black text-[#225F91]">
                      {formatCurrency(pharm.trueTotalPrice)}
                    </span>
                  </div>

                  {/* Error message */}
                  {hasError && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl" role="alert">
                      <p className="text-sm font-bold text-red-700">{hasError}</p>
                    </div>
                  )}

                  {/* Bulk Add Button */}
                  {itemsNotInCart > 0 && (
                    <Button
                      onClick={() => debouncedBulkAdd(pharm.pharmacyId, pharm.meds)}
                      disabled={isBulkAdding[pharm.pharmacyId]}
                      aria-label={`Add remaining ${itemsNotInCart} items to cart from ${pharm.pharmacyName}`}
                      className="w-full h-14 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBulkAdding[pharm.pharmacyId] ? (
                        <span className="relative z-10 flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} aria-hidden="true" />
                          Adding...
                        </span>
                      ) : (
                        <>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <ShoppingCart className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                            Add Remaining {itemsNotInCart} Item{itemsNotInCart > 1 ? 's' : ''} to Cart
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </>
                      )}
                    </Button>
                  )}

                  {itemsInCart > 0 && itemsNotInCart === 0 && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-100 rounded-2xl border-2 border-green-300">
                      <Check className="h-5 w-5 text-green-700" strokeWidth={3} aria-hidden="true" />
                      <span className="text-sm font-black text-green-700">
                        All items from this pharmacy are in your cart
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PharmacyRecommendations;