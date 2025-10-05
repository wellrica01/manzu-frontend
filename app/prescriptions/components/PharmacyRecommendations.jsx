'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Store, DollarSign, Navigation, Clock, Check, Loader2, Award, ShoppingCart, TrendingDown, Trash2, Package } from 'lucide-react';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';

// Constants
const SORT_OPTIONS = {
  DEFAULT: 'default',
  CHEAPEST: 'cheapest',
  NEAREST: 'nearest'
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
  onRemoveItem,
}) => {
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.DEFAULT);
  const [isBulkAdding, setIsBulkAdding] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const getQty = useCallback((medId) => {
    const medication = medications?.find(m => m?.id === medId);
    return medication?.quantity || 1;
  }, [medications]);

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

  const sortedPharmacyMap = useMemo(() => {
    if (!enrichedPharmacies?.length) return [];

    let filtered = enrichedPharmacies;
    
    if (filterOpen) {
      filtered = enrichedPharmacies.filter(pharm => 
        isPharmacyOpenNow(pharm?.operatingHours)
      );
    }

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
      
      default:
        return sorted.sort((a, b) => (b?.medCount || 0) - (a?.medCount || 0));
    }
  }, [enrichedPharmacies, sortOption, filterOpen]);

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

  const handleBulkAdd = useCallback(async (pharmacyId, meds) => {
    if (!prescriptionId || !meds?.length) return;

    setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: true }));
    setApiErrors(prev => ({ ...prev, [pharmacyId]: null }));
    
    try {
      let medsToAdd = meds;
      
      if (handleBulkAddWithDuplicateCheck) {
        const result = await handleBulkAddWithDuplicateCheck(pharmacyId, meds);
        if (!result) return;
        medsToAdd = result.meds;
      }

      const itemsToAdd = medsToAdd.filter(med => 
        med?.id && !isInCart(med.id, pharmacyId)
      );
      
      if (itemsToAdd.length === 0) return;

      const items = itemsToAdd.map(med => ({
        medicationId: med.id,
        pharmacyId,
        quantity: getQty(med.id)
      }));

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
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add medications');
      }

      const result = await response.json();
      
      if (fetchCart) await fetchCart();

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

      if (setLastAddedItems && result?.orderItems?.length && result?.addedItems?.length) {
        setLastAddedItems(
          result.orderItems.map((orderItem, index) => ({
            id: orderItem.id,
            name: result.addedItems[index].displayName,
            pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
            quantity: orderItem.quantity
          }))
        );
      }

      if (setOpenCartDialog) setOpenCartDialog(true);

    } catch (error) {
      setApiErrors(prev => ({ 
        ...prev, 
        [pharmacyId]: error.message || 'Failed to add medications'
      }));
    } finally {
      setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: false }));
    }
  }, [prescriptionId, handleBulkAddWithDuplicateCheck, isInCart, getQty, guestId, userIdentifier, pharmacyRecommendations, fetchCart, setLastAddedItems, setOpenCartDialog]);

  const debouncedBulkAdd = useMemo(
    () => debounce(handleBulkAdd, 300),
    [handleBulkAdd]
  );


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

  if (!pharmacyRecommendations) return null;

  return (
    <div className="space-y-6 pb-24">
      {/* Sort & Filter Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sortFilterOptions.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => option.isFilter ? setFilterOpen(!filterOpen) : setSortOption(option.value)}
              className={`h-11 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                (option.isFilter ? filterOpen : sortOption === option.value)
                  ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-[#225F91]"
                  : "bg-white text-[#225F91] border-gray-300 hover:border-[#1ABA7F]"
              }`}
            >
              <option.icon className="h-4 w-4 mr-2" strokeWidth={2.5} />
              {option.label}
            </Button>
          ))}
        </div>

        <div className="p-3 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-xl border border-[#1ABA7F]/20">
          <p className="text-sm font-semibold text-gray-700 text-center">
            {filterOpen && <span className="text-green-600">✓ Open pharmacies only · </span>}
            {sortOption === SORT_OPTIONS.DEFAULT && 'Sorted by most medications available'}
            {sortOption === SORT_OPTIONS.CHEAPEST && 'Sorted by cheapest total price'}
            {sortOption === SORT_OPTIONS.NEAREST && 'Sorted by nearest distance'}
          </p>
        </div>
      </div>

      {/* Pharmacy cards */}
      {sortedPharmacyMap.length === 0 ? (
        <Card className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-12">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-black text-gray-700 mb-2">No pharmacies found</h3>
            <p className="text-gray-600 font-medium">Try adjusting your filters</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
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
                className="overflow-hidden bg-white pt-0 border-2 border-[#1ABA7F]/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Cover Image */}
                {pharm.logoUrl && (
                  <div className="relative w-full h-40 sm:h-48 overflow-hidden">
                    <img
                      src={pharm.logoUrl}
                      alt={`${pharm.pharmacyName || 'Pharmacy'} logo`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Badges on Image */}
                    <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
                      {isNearest && (
                        <Badge className="px-3 py-1.5 rounded-lg font-bold text-sm bg-[#225F91] text-white border-2 border-white shadow-lg">
                          <Navigation className="h-3 w-3 mr-1" strokeWidth={3} />
                          Nearest
                        </Badge>
                      )}
                      {isCheapest && (
                        <Badge className="px-3 py-1.5 rounded-lg font-bold text-sm bg-[#1ABA7F] text-white border-2 border-white shadow-lg">
                          <DollarSign className="h-3 w-3 mr-1" strokeWidth={3} />
                          Cheapest
                        </Badge>
                      )}
                    </div>

                    {/* Pharmacy Name on Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30">
                          <Store className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-white drop-shadow-lg flex-1">
                          {pharm.pharmacyName || 'Unknown Pharmacy'}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="pt-0 px-4 sm:p-6 space-y-4">
                  {/* Header (without cover) */}
                  {!pharm.logoUrl && (
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20">
                        <Store className="h-6 w-6 text-[#225F91]" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#225F91] flex-1">
                        {pharm.pharmacyName || 'Unknown Pharmacy'}
                      </h3>
                    </div>
                  )}

                  {/* Info Cards */}
                  <div className="space-y-2">
                    {pharm.address && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-gray-700 font-medium line-clamp-2 flex-1">
                          {pharm.address}
                        </span>
                      </div>
                    )}

                    {pharm.operatingHours && (() => {
                      const formattedHours = formatOperatingHours(pharm.operatingHours);
                      if (!formattedHours) return null;
                      return (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <Clock className="h-4 w-4 text-[#225F91] flex-shrink-0" strokeWidth={2.5} />
                          <span className={`text-sm font-semibold flex-1 ${getOperatingHoursTextColor(pharm.operatingHours)}`}>
                            {formattedHours.text}
                          </span>
                          {formattedHours.status === 'open' && (
                            <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
                              Open
                            </Badge>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Navigation className="h-4 w-4 text-[#76D1F3] flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-gray-700">
                        {formatDistance(pharm.distance_km)}
                      </span>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 border border-[#1ABA7F]/30">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#225F91]" />
                        <span className="text-sm font-bold text-gray-700">
                          {pharm.medCount || 0}/{medications?.length || 0} available
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-[#225F91]">
                        {formatCurrency(pharm.trueTotalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                      Medications
                    </h4>

                    {(pharm.meds || []).map(med => {
                      if (!med?.id) return null;

                      const qty = getQty(med.id);
                      const lineTotal = (med.price || 0) * qty;
                      const inCart = isInCart(med.id, pharm.pharmacyId);
                      const isLowestPrice = lowestPrices[med.id] === med.price;
                      const isAddingSingle = isAddingToCart?.[`${med.id}-${pharm.pharmacyId}`];

                      return (
                        <div
                          key={med.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 mb-1">
                                {med.displayName || 'Unknown Medication'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                <span className="px-2 py-1 bg-white rounded border border-gray-300">
                                  Qty: {qty}
                                </span>
                                <span>{formatCurrency(med.price)} each</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {isLowestPrice && (
                                <Badge className="bg-green-100 text-green-700 border-green-300 font-bold text-xs mb-1">
                                  <TrendingDown className="h-3 w-3 mr-1" strokeWidth={3} />
                                  Best
                                </Badge>
                              )}
                              <p className="text-sm font-black text-[#225F91]">
                                {formatCurrency(lineTotal)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {inCart ? (
                              <>
                                <Button
                                  variant="ghost"
                                  disabled
                                  className="flex-1 h-10 rounded-lg font-bold text-sm bg-green-100 text-green-700 border border-green-300"
                                >
                                  <Check className="h-4 w-4 mr-2" strokeWidth={3} />
                                  Added
                                </Button>
                                <Button
                                  onClick={() => handleRemove(med, pharm)}
                                  variant="outline"
                                  className="flex-1 h-10 rounded-lg font-bold text-sm border border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" strokeWidth={3} />
                                  Remove
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleAddToCart(med.id, pharm.pharmacyId, med.displayName)}
                                disabled={isAddingSingle}
                                className="w-full h-10 rounded-lg font-bold text-sm bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-[1.02] transition-all disabled:opacity-50"
                              >
                                {isAddingSingle ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={3} />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4 mr-2" strokeWidth={3} />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Error */}
                  {hasError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-700">{hasError}</p>
                    </div>
                  )}

                  {/* Bulk Actions */}
                  {medications?.length > 1 && (
                    itemsNotInCart > 0 ? (
                      <Button
                        onClick={() => debouncedBulkAdd(pharm.pharmacyId, pharm.meds)}
                        disabled={isBulkAdding[pharm.pharmacyId]}
                        className="w-full h-12 rounded-xl font-black text-base bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {isBulkAdding[pharm.pharmacyId] ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" strokeWidth={3} />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-5 w-5 mr-2" strokeWidth={3} />
                            Add All {itemsNotInCart} to Cart
                          </>
                        )}
                      </Button>
                    ) : (
                      itemsInCart > 0 && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-xl border border-green-300">
                          <Check className="h-5 w-5 text-green-700" strokeWidth={3} />
                          <span className="text-sm font-bold text-green-700">
                            All items in cart
                          </span>
                        </div>
                      )
                    )
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