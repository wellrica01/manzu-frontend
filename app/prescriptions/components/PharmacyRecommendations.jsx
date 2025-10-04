"use client";
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, DollarSign, Navigation, Clock, Check, Loader2, Award, ShoppingCart, TrendingDown, Trash2 } from 'lucide-react';

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
  const [sortOption, setSortOption] = useState('default');
  const [isBulkAdding, setIsBulkAdding] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);

  const getQty = medId =>
    medications.find(m => m.id === medId)?.quantity || 1;

  // Find the lowest price for each medication across all pharmacies
  const lowestPrices = useMemo(() => {
    const prices = {};
    pharmacyRecommendations?.forEach(pharm => {
      pharm.meds.forEach(med => {
        if (!prices[med.id] || med.price < prices[med.id]) {
          prices[med.id] = med.price;
        }
      });
    });
    return prices;
  }, [pharmacyRecommendations]);

  const enrichedPharmacies = useMemo(() => {
    if (!pharmacyRecommendations) return [];
    return pharmacyRecommendations.map(pharm => {
      const totalPrice = pharm.meds.reduce((sum, med) => {
        const qty = getQty(med.id);
        return sum + med.price * qty;
      }, 0);
      return { ...pharm, trueTotalPrice: totalPrice };
    });
  }, [pharmacyRecommendations, medications]);

  const sortedPharmacyMap = useMemo(() => {
    if (!enrichedPharmacies) return [];

    let filtered = enrichedPharmacies;
    if (filterOpen) {
      filtered = enrichedPharmacies.filter(pharm =>
        isPharmacyOpenNow(pharm.operatingHours)
      );
    }

    if (sortOption === 'cheapest') {
      return [...filtered].sort((a, b) => a.trueTotalPrice - b.trueTotalPrice);
    }

    if (sortOption === 'nearest') {
      return [...filtered].sort((a, b) => {
        if (isNaN(a.distance_km)) return 1;
        if (isNaN(b.distance_km)) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return [...filtered].sort((a, b) => b.medCount - a.medCount);
  }, [enrichedPharmacies, sortOption, filterOpen]);

  const validDistances =
    enrichedPharmacies
      ?.filter(p => typeof p.distance_km === 'number' && !isNaN(p.distance_km))
      .map(p => p.distance_km) || [];

  const minDistance =
    validDistances.length > 0 ? Math.min(...validDistances) : null;

  const minTotalPrice =
    enrichedPharmacies && enrichedPharmacies.length > 0
      ? Math.min(...enrichedPharmacies.map(p => p.trueTotalPrice))
      : null;

  const handleBulkAdd = async (pharmacyId, meds) => {
    setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: true }));
    
    try {
      // First check for duplicates if handler provided
      let medsToAdd = meds;
      
      if (handleBulkAddWithDuplicateCheck) {
        const result = await handleBulkAddWithDuplicateCheck(pharmacyId, meds);
        if (!result) {
          // Duplicates found - dialog is shown to user
          // They'll make a choice and it will continue via the dialog actions
          return;
        }
        // Use the filtered meds (safe ones only or all after user action)
        medsToAdd = result.meds;
      }

      if (!prescriptionId) {
        throw new Error('Prescription ID not found');
      }

      // Only add items that aren't already in cart from THIS pharmacy
      const itemsToAdd = medsToAdd.filter(med => !isInCart(med.id, pharmacyId));
      
      if (itemsToAdd.length === 0) {
        return; // All items already in cart
      }

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
            'x-guest-id': guestId,
          },
          body: JSON.stringify({
            userIdentifier,
            guestId,
            items,
            prescriptionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medications to cart');
      }

      const result = await response.json();
      await fetchCart();

      const pharmacy = pharmacyRecommendations.find(p => p.pharmacyId === pharmacyId);

   // Map using orderItems from the API response
    setLastAddedItems(
      result.orderItems.map((orderItem, index) => ({
        id: orderItem.id, // ✅ Use orderItem.id (375, 376, 377)
        name: result.addedItems[index].quantity > 1 
          ? `${result.addedItems[index].displayName} x${result.addedItems[index].quantity}` 
          : result.addedItems[index].displayName,
        pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
        quantity: orderItem.quantity
      }))
    );

      setOpenCartDialog(true);
    } catch (error) {
      console.error('Bulk add error:', error);
    } finally {
      setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: false }));
    }
  };


  const isPharmacyOpenNow = (operatingHours) => {
    if (!operatingHours) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todayHours = operatingHours.find(h => h.dayOfWeek === currentDay);
    if (!todayHours) return false;
    
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return null;
    const now = new Date();
    const currentDay = now.getDay();
    const todayHours = operatingHours.find(h => h.dayOfWeek === currentDay);
    if (!todayHours) return null;
    return {
      text: `${todayHours.openTime} - ${todayHours.closeTime}`
    };
  };

  const getOperatingHoursTextColor = (operatingHours) => {
    return isPharmacyOpenNow(operatingHours) ? 'text-green-700' : 'text-orange-600';
  };

  return (
    <div className="mb-24 space-y-8">
      {/* Sort & Filter Controls */}
      <div className="space-y-4 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'default', label: 'Best Deal', icon: Award },
            { value: 'cheapest', label: 'Cheapest', icon: DollarSign },
            { value: 'nearest', label: 'Nearest', icon: Navigation },
            { value: 'open', label: 'Open Now', icon: Clock, isFilter: true },
          ].map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => option.isFilter ? setFilterOpen(!filterOpen) : setSortOption(option.value)}
              className={`h-12 rounded-2xl font-black transition-all duration-300 hover:scale-105 border-2 shadow-lg ${
                (option.isFilter ? filterOpen : sortOption === option.value)
                  ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-[#225F91]"
                  : "bg-white text-[#225F91] border-gray-300 hover:border-[#1ABA7F]"
              }`}
            >
              <option.icon className="h-5 w-5 mr-2" strokeWidth={2.5} />
              {option.label}
            </Button>
          ))}
        </div>

        <div className="p-4 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl border-2 border-[#1ABA7F]/20">
          <p className="text-sm font-bold text-gray-700 text-center">
            {filterOpen && <span className="text-green-600">✓ Showing only open pharmacies · </span>}
            {sortOption === 'default' && 'Sorted by Most Medications Available'}
            {sortOption === 'cheapest' && 'Sorted by Cheapest Total Price'}
            {sortOption === 'nearest' && 'Sorted by Nearest Distance'}
          </p>
        </div>
      </div>

      {/* Pharmacy cards */}
      {sortedPharmacyMap.length === 0 ? (
        <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden p-12">
          <div className="text-center">
            <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-black text-gray-700 mb-3">No pharmacies found</h3>
            <p className="text-gray-400 font-medium">Try adjusting your location filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 px-2">
          {sortedPharmacyMap.map((pharm, index) => {
            const isNearest = minDistance !== null && pharm.distance_km === minDistance;
            const isCheapest = minTotalPrice !== null && pharm.trueTotalPrice === minTotalPrice;
            const itemsInCart = pharm.meds.filter(med => isInCart(med.id, pharm.pharmacyId)).length;
            const itemsNotInCart = pharm.meds.filter(med => !isInCart(med.id, pharm.pharmacyId)).length;

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
                      alt={`${pharm.pharmacyName} cover`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    <div className="absolute top-4 left-4 right-4 flex justify-between gap-2">
                      {isNearest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-2 border-white shadow-2xl">
                          <Navigation className="h-4 w-4 mr-1.5" strokeWidth={3} />
                          Nearest
                        </Badge>
                      )}

                      {isCheapest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-2 border-white shadow-2xl ml-auto">
                          <DollarSign className="h-4 w-4 mr-1.5" strokeWidth={3} />
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
                        <HospitalIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-[#225F91] line-clamp-2 mb-2 group-hover:text-[#1ABA7F] transition-colors duration-300">
                        {pharm.pharmacyName}
                      </h3>
                      {pharm.address && (
                        <div className="flex items-start gap-3 p-2 sm:p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
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
                          <Clock className="h-5 w-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
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
                      <Navigation className="h-5 w-5 text-[#76D1F3] flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-sm font-bold text-gray-700">
                        {typeof pharm.distance_km === 'number' && !isNaN(pharm.distance_km)
                          ? `${pharm.distance_km.toFixed(1)} km away`
                          : 'Distance N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Medications list with individual add buttons */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] rounded-full" />
                        Medications
                      </h4>
                      <Badge className={`${pharm.medCount === medications.length ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"} font-black px-3 py-1.5`}>
                        {pharm.medCount}/{medications.length} available
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      {pharm.meds.map(med => {
                        const qty = getQty(med.id);
                        const lineTotal = med.price * qty;
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
                                  {med.displayName}
                                </p>
                                {isLowestPrice && (
                                  <Badge className="bg-green-100 text-green-700 border border-green-300 font-black text-xs flex-shrink-0">
                                    <TrendingDown className="h-3 w-3 mr-1" strokeWidth={3} />
                                    Best Price
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                  <span className="px-2 py-1 bg-white rounded-lg border border-gray-300">
                                    Qty: {qty}
                                  </span>
                                  <span>₦{med.price.toLocaleString()} each</span>
                                </div>
                                <span className="text-sm font-black text-[#225F91]">
                                  ₦{lineTotal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action buttons - Add/Remove */}
                            <div className="flex gap-2 w-full sm:w-auto">
                        {inCart ? (
                          <>
                            <Button
                              variant="ghost"
                              disabled
                              className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold text-sm bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed"
                            >
                              <Check className="h-4 w-4 mr-2" strokeWidth={3} />
                              Added
                            </Button>
                            <Button
                              onClick={() => {
                                // Find the cart item for this medication
                                const cartItem = cart?.pharmacies
                                  ?.find(p => p.pharmacy.id === pharm.pharmacyId)
                                  ?.items?.find(item => item.medication.id === med.id);
                                
                                if (cartItem) {
                                  // Trigger the remove dialog with item details
                                  onRemoveItem({
                                    id: cartItem.id,
                                    name: med.displayName,
                                    quantity: cartItem.quantity
                                  });
                                }
                              }}
                              variant="outline"
                              className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300 group"
                            >
                              <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" strokeWidth={3} />
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(med.id, pharm.pharmacyId, med.displayName)}
                            disabled={isAddingSingle}
                            className="w-full h-10 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-105 shadow-lg transition-all duration-300"
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
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-2xl border-2 border-[#1ABA7F]/30 mb-6">
                    <span className="text-lg font-black text-gray-700">Total Price</span>
                    <span className="text-xl sm:text-3xl font-black text-[#225F91]">
                      ₦{pharm.trueTotalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Bulk Add Button - Context aware */}
                  {itemsNotInCart > 0 && (
                    <Button
                      onClick={() => handleBulkAdd(pharm.pharmacyId, pharm.meds)}
                      className="w-full h-14 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white"
                      disabled={isBulkAdding[pharm.pharmacyId]}
                    >
                      {isBulkAdding[pharm.pharmacyId] ? (
                        <span className="relative z-10 flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                          Adding...
                        </span>
                      ) : (
                        <>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <ShoppingCart className="h-5 w-5" strokeWidth={3} />
                            Add Remaining {itemsNotInCart} Item{itemsNotInCart > 1 ? 's' : ''} to Cart
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </>
                      )}
                    </Button>
                  )}

                  {itemsInCart > 0 && itemsNotInCart === 0 && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-100 rounded-2xl border-2 border-green-300">
                      <Check className="h-5 w-5 text-green-700" strokeWidth={3} />
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