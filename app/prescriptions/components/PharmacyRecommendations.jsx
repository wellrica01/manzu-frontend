import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, DollarSign, Navigation, Clock, Check, Loader2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';

const PharmacyRecommendations = ({
  pharmacyRecommendations,
  medications,
  handleAddToCart,
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
}) => {
  const [sortOption, setSortOption] = useState('default');
  const [isBulkAdding, setIsBulkAdding] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);

  const getQty = medId =>
    medications.find(m => m.id === medId)?.quantity || 1;

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
      if (!prescriptionId) {
        throw new Error('Prescription ID not found');
      }

      const items = meds.map(med => ({
        medicationId: med.id,
        pharmacyId,
        quantity: getQty(med.id),
        displayName: med.displayName,
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
      setLastAddedItems(result.addedItems.map(item => item.displayName));
      setOpenCartDialog(true);
      toast.success(
        `Added ${result.addedItems.length} medications to cart from ${
          meds[0].pharmacyName || 'pharmacy'
        }`,
        { duration: 4000 }
      );
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error(error.message || 'Failed to add medications to cart', { duration: 4000 });
    } finally {
      setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: false }));
    }
  };

  return (
    <div className="mb-24 space-y-8">
      {/* Premium Sort & Filter Controls */}
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
              className={cn(
                "h-12 rounded-2xl font-black transition-all duration-300 hover:scale-105 border-2 shadow-lg",
                (option.isFilter ? filterOpen : sortOption === option.value)
                  ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-[#225F91] hover:from-[#1a4a73] hover:to-[#225F91]"
                  : "bg-white text-[#225F91] border-gray-300 hover:border-[#1ABA7F] hover:bg-[#1ABA7F]/5"
              )}
            >
              <option.icon className="h-5 w-5 mr-2" strokeWidth={2.5} />
              {option.label}
            </Button>
          ))}
        </div>

        {/* Sort explanation */}
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
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-gray-200/50 to-transparent rounded-br-full" />
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6 shadow-lg">
              <MapPin className="h-10 w-10 text-gray-400" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-gray-700 mb-3">No pharmacies found</h3>
            {(state || lga || ward) && (
              <p className="text-gray-500 font-semibold mb-2">
                Location: {state}{lga ? `, ${lga}` : ''}{ward ? ` (Ward: ${ward})` : ''}
              </p>
            )}
            <p className="text-gray-400 font-medium">Try adjusting your location filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 px-2">
          {sortedPharmacyMap.map((pharm, index) => {
            const isNearest =
              minDistance !== null &&
              typeof pharm.distance_km === 'number' &&
              !isNaN(pharm.distance_km) &&
              pharm.distance_km === minDistance;

            const isCheapest =
              minTotalPrice !== null &&
              pharm.trueTotalPrice === minTotalPrice;

            return (
              <Card
                key={pharm.pharmacyId}
                className="relative overflow-hidden bg-white/98 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Decorative corner */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/15 to-transparent rounded-br-full" />

                {/* Image with premium badges */}
                {pharm.logoUrl && (
                  <div className="relative w-full h-48 sm:h-64 overflow-hidden">
                    <img
                      src={pharm.logoUrl}
                      alt={`${pharm.pharmacyName} cover`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    {/* Premium Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between gap-2">
                      {isNearest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-2 border-white shadow-2xl backdrop-blur-sm">
                          <Navigation className="h-4 w-4 mr-1.5" strokeWidth={3} />
                          Nearest
                        </Badge>
                      )}

                      {isCheapest && (
                        <Badge className="px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-2 border-white shadow-2xl backdrop-blur-sm ml-auto">
                          <DollarSign className="h-4 w-4 mr-1.5" strokeWidth={3} />
                          Cheapest
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Card body */}
                <CardContent className="px-4 sm:px-6 pb-6 pt-1 sm:py-8 relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-2xl blur-lg opacity-50 animate-pulse" />
                      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#1ABA7F] to-[#225F91] shadow-xl">
                        <HospitalIcon className="h-6 w-6 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-[#225F91] truncate mb-2 group-hover:text-[#1ABA7F] transition-colors duration-300">
                        {pharm.pharmacyName}
                      </h3>
                      <Badge className="bg-gradient-to-r from-[#1ABA7F]/20 to-[#225F91]/20 text-[#225F91] border-2 border-[#1ABA7F]/30 font-black px-3 py-1.5">
                        Has {pharm.medCount}/{pharmacyRecommendations.length} medications
                      </Badge>
                    </div>
                  </div>

                  {/* Location & Hours Info */}
                  <div className="space-y-3 mb-6">
                    {pharm.address && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-sm text-gray-700 font-semibold line-clamp-2">
                          {pharm.address}
                        </p>
                      </div>
                    )}

                    {pharm.operatingHours && (() => {
                      const formattedHours = formatOperatingHours(pharm.operatingHours);
                      if (!formattedHours) return null;
                      return (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                          <Clock className="h-5 w-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                          <div className="flex-1">
                            <span className="text-xs font-black text-gray-600 uppercase tracking-wide block">
                              Opening Hours
                            </span>
                            <span
                              className={cn(
                                'text-sm font-bold',
                                getOperatingHoursTextColor(pharm.operatingHours)
                              )}
                            >
                              {formattedHours.text}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl">
                      <Navigation className="h-5 w-5 text-[#76D1F3] flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-sm font-bold text-gray-700">
                        {typeof pharm.distance_km === 'number' && !isNaN(pharm.distance_km)
                          ? `${pharm.distance_km.toFixed(1)} km away`
                          : 'Distance N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Medications list */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm sm:text-base font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] rounded-full" />
                      Medications
                    </h4>
                    <ul className="space-y-2">
                      {pharm.meds.map(med => {
                        const qty = getQty(med.id);
                        const lineTotal = med.price * qty;
                        const inCart = isInCart(med.id, pharm.pharmacyId);
                        
                        return (
                          <li
                            key={med.id}
                            className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#1ABA7F]/30 transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 mb-1">
                                {med.displayName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                <span className="px-2 py-1 bg-white rounded-lg border border-gray-300">
                                  Qty: {qty}
                                </span>
                                <span>₦{med.price.toLocaleString()} each</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-base font-black text-[#225F91]">
                                ₦{lineTotal.toLocaleString()}
                              </span>
                              {inCart && (
                                <Badge className="bg-green-100 text-green-700 border border-green-300 font-black">
                                  <Check className="h-3 w-3 mr-1" strokeWidth={3} />
                                  Added
                                </Badge>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-2xl border-2 border-[#1ABA7F]/30 mb-6">
                    <span className="text-lg font-black text-gray-700">Total Price</span>
                    <span className="text-xl sm:text-3xl font-black text-[#225F91]">
                      ₦{pharm.trueTotalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleBulkAdd(pharm.pharmacyId, pharm.meds)}
                    className="w-full h-14 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    disabled={
                      pharm.meds.every(med => isInCart(med.id, pharm.pharmacyId)) ||
                      isBulkAdding[pharm.pharmacyId]
                    }
                  >
                    {isBulkAdding[pharm.pharmacyId] ? (
                      <span className="relative z-10 flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                        Adding...
                      </span>
                    ) : pharm.meds.every(med => isInCart(med.id, pharm.pharmacyId)) ? (
                      <span className="relative z-10 flex items-center gap-2">
                        <Check className="h-5 w-5" strokeWidth={3} />
                        All Added to Cart
                      </span>
                    ) : (
                      <>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Add {pharm.meds.length} Medication{pharm.meds.length > 1 ? 's' : ''} to Cart
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </>
                    )}
                  </Button>
                </CardContent>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PharmacyRecommendations;