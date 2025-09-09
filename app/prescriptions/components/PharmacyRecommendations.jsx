import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon } from 'lucide-react';
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

  // Helper: get prescribed quantity for a med
  const getQty = medId =>
    medications.find(m => m.id === medId)?.quantity || 1;

  // Enrich pharmacy data with true totalPrice (including quantities)
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

  // Sort pharmacies based on sortOption
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

  // Default: Sort by number of meds available
  return [...filtered].sort((a, b) => b.medCount - a.medCount);
}, [enrichedPharmacies, sortOption, filterOpen]);

  // Precompute min distance & min total price
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

  // Bulk add meds to cart
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
        fullName: med.fullName,
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
      setLastAddedItems(result.addedItems.map(item => item.fullName));
      setOpenCartDialog(true);
      toast.success(
        `Added ${result.addedItems.length} medications to cart from ${
          meds[0].pharmacyName || 'pharmacy'
        }`
      );
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error(error.message || 'Failed to add medications to cart');
    } finally {
      setIsBulkAdding(prev => ({ ...prev, [pharmacyId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={sortOption === 'default' ? 'default' : 'outline'}
          onClick={() => setSortOption('default')}
          className="flex-1 min-w-[90px] flex items-center justify-center gap-1"
        >
          Best Deal
        </Button>
        <Button
          variant={sortOption === 'cheapest' ? 'default' : 'outline'}
          onClick={() => setSortOption('cheapest')}
          className="flex-1 min-w-[90px] flex items-center justify-center gap-1 "
        >
          Cheapest
        </Button>
        <Button
          variant={sortOption === 'nearest' ? 'default' : 'outline'}
          onClick={() => setSortOption('nearest')}
          className="flex-1 min-w-[90px] flex items-center justify-center gap-1 "
        >
          Nearest
        </Button>
        <Button
            variant={filterOpen ? 'default' : 'outline'}
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1"
            >
            Open Now
        </Button>

      </div>

      {/* Sort explanation */}
        <div className="mb-5 text-sm text-gray-600 font-medium">
        {filterOpen && <span className="text-green-600">Showing only open pharmacies · </span>}
        {sortOption === 'default' && 'Sorted by Most Medications Available'}
        {sortOption === 'cheapest' && 'Sorted by Cheapest Total Price'}
        {sortOption === 'nearest' && 'Sorted by Nearest Distance'}
        </div>


      {/* Pharmacy cards */}
      {sortedPharmacyMap.length === 0 ? (
        <div className="block sm:hidden text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-base font-medium">
            No pharmacies found
        </p>
        {(state || lga || ward) && (
            <p className="text-gray-400 text-base mt-2 italic">
            Location: {state}{lga ? `, ${lga}` : ''}{ward ? ` (Ward: ${ward})` : ''}
            </p>
        )}
        <p className="text-gray-400 text-sm mt-3">
            Try another location
        </p>
        </div>
      ) : (
        sortedPharmacyMap.map(pharm => {
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
              className="overflow-hidden bg-white/95 border border-[#1ABA7F]/20 rounded-2xl p-0 shadow-lg"
            >
              {/* Image with badges */}
              {pharm.logoUrl && (
                <div className="relative w-full h-32 sm:h-56 overflow-hidden rounded-t-xl">
                  <img
                    src={pharm.logoUrl}
                    alt={`${pharm.pharmacyName} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                  {isNearest && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs bg-[#225F91]/90 text-white border border-white/30 shadow-md"
                    >
                      Nearest
                    </Badge>
                  )}

                  {isCheapest && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-xs bg-[#1ABA7F]/90 text-white border border-white/30 shadow-md"
                    >
                      Cheapest
                    </Badge>
                  )}
                </div>
              )}

              {/* Card body */}
              <CardContent className="px-4 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-[#1ABA7F]/10 shadow-sm">
                    <HospitalIcon className="h-5 w-5 text-[#225F91]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#225F91] truncate">
                    {pharm.pharmacyName}
                  </h3>
                </div>

                <Badge className="bg-[#1ABA7F]/20 text-[#1ABA7F] mb-2">
                  Has {pharm.medCount}/{pharmacyRecommendations.length} medications
                </Badge>

                {pharm.address && (
                  <div className="flex items-start gap-1 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {pharm.address}
                    </p>
                  </div>
                )}

                {pharm.operatingHours && (() => {
                  const formattedHours = formatOperatingHours(pharm.operatingHours);
                  if (!formattedHours) return null;
                  return (
                    <div className="flex items-center mb-2 gap-1">
                      <span className="text-gray-500 text-xs font-semibold min-w-[60px]">
                        Opening Hours:
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          getOperatingHoursTextColor(pharm.operatingHours)
                        )}
                      >
                        {formattedHours.text}
                      </span>
                    </div>
                  );
                })()}

                <span className="text-sm text-gray-600">
                  {typeof pharm.distance_km === 'number' && !isNaN(pharm.distance_km)
                    ? `${pharm.distance_km.toFixed(1)} km away`
                    : 'N/A'}
                </span>

                {/* Medications list with quantity and line totals */}
                <ul className="list-disc pl-4 my-4 space-y-1">
                  {pharm.meds.map(med => {
                    const qty = getQty(med.id);
                    const lineTotal = med.price * qty;
                    return (
                      <li
                        key={med.id}
                        className="text-sm text-gray-800 flex flex-wrap items-center gap-2"
                      >
                        <span>
                          {med.fullName}{' '}
                          <span className="text-gray-500">(x{qty})</span> – ₦
                          {med.price.toLocaleString()} each
                        </span>
                        <span className="ml-2 text-gray-700 font-medium">
                          = ₦{lineTotal.toLocaleString()}
                        </span>
                        {isInCart(med.id, pharm.pharmacyId) && (
                          <Badge className="ml-2 bg-green-100 text-green-700">
                            Added
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <p className="text-base font-semibold text-gray-700 mb-2">
                  Total Price:{' '}
                  <span className="text-[#225F91]">
                    ₦{pharm.trueTotalPrice.toLocaleString()}
                  </span>
                </p>

                <Button
                  onClick={() => handleBulkAdd(pharm.pharmacyId, pharm.meds)}
                  className="h-12 w-full bg-[#225F91] text-white hover:bg-[#1A4971]"
                  disabled={
                    pharm.meds.every(med => isInCart(med.id, pharm.pharmacyId)) ||
                    isBulkAdding[pharm.pharmacyId]
                  }
                >
                  {isBulkAdding[pharm.pharmacyId] ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </div>
                  ) : pharm.meds.every(med => isInCart(med.id, pharm.pharmacyId)) ? (
                    'All Added'
                  ) : (
                    `Add ${pharm.meds.length} Medications`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default PharmacyRecommendations;
