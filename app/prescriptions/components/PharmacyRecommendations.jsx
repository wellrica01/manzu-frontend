'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MapPin, Store, DollarSign, Navigation, Clock, Check, 
  Loader2, Award, ShoppingCart, TrendingDown, Trash2, Package 
} from 'lucide-react';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';
import { usePharmacySort } from '@/hooks/usePharmacySort';
import { useCartOperations } from '@/hooks/useCartOperations';

// Constants
const SORT_OPTIONS = {
  DEFAULT: 'default',
  CHEAPEST: 'cheapest',
  NEAREST: 'nearest'
};

// Utility functions with validation
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

// Validation helper
const validateBulkAddParams = (pharmacyId, items) => {
  // Validate pharmacyId
  if (
    pharmacyId === undefined ||
    pharmacyId === null ||
    typeof pharmacyId !== 'number' ||
    isNaN(pharmacyId)
  ) {
    throw new Error('Invalid pharmacy ID');
  }

  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No items to add');
  }

  items.forEach((item, index) => {
    // Validate medicationId as number
    if (
      item.medicationId === undefined ||
      item.medicationId === null ||
      typeof item.medicationId !== 'number' ||
      isNaN(item.medicationId)
    ) {
      throw new Error(`Invalid medication ID at index ${index}`);
    }

    // Validate pharmacyId as number
    if (
      item.pharmacyId === undefined ||
      item.pharmacyId === null ||
      typeof item.pharmacyId !== 'number' ||
      isNaN(item.pharmacyId)
    ) {
      throw new Error(`Invalid pharmacy ID at index ${index}`);
    }

    // Validate quantity
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      throw new Error(`Invalid quantity at index ${index}`);
    }
  });
};


/* ----------------------------- Empty States ----------------------------- */
const NoOpenPharmaciesState = ({ onShowAll }) => (
  <Card className="bg-white border-2 border-orange-200 rounded-2xl shadow-lg p-12">
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-2">
        <Clock className="h-8 w-8 text-orange-600" strokeWidth={2.5} />
      </div>
      <h3 className="text-2xl font-black text-gray-800">
        No Pharmacies Currently Open
      </h3>
      <p className="text-gray-600 font-medium max-w-md mx-auto">
        All pharmacies offering these medications are currently closed.
      </p>
      <Button
        onClick={onShowAll}
        className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white rounded-xl px-6 py-3 font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
      >
        Show All Pharmacies
      </Button>
    </div>
  </Card>
);

const EmptyPharmaciesState = () => (
  <Card className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-12">
    <div className="text-center">
      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" strokeWidth={2} />
      <h3 className="text-2xl font-black text-gray-700 mb-2">No pharmacies found</h3>
      <p className="text-gray-600 font-medium">Try adjusting your filters</p>
    </div>
  </Card>
);

/* ----------------------------- Medication Card Component ----------------------------- */
const MedicationCard = React.memo(({ 
  med, 
  pharmacy, 
  qty, 
  lineTotal, 
  inCart, 
  isLowestPrice, 
  isAddingSingle,
  onAddToCart,
  onRemove,
}) => {
  if (!med?.id) return null;

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
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
              onClick={() => onRemove(med, pharmacy)}
              variant="outline"
              className="flex-1 h-10 rounded-lg font-bold text-sm border border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={3} />
              Remove
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onAddToCart(med.id, pharmacy.pharmacyId, med.displayName)}
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
});

MedicationCard.displayName = 'MedicationCard';

/* ----------------------------- Pharmacy Card Component ----------------------------- */
const PharmacyCard = React.memo(({ 
  pharmacy,
  medications,
  getQty,
  lowestPrices,
  minDistance,
  minTotalPrice,
  isInCart,
  isAddingToCart,
  onAddToCart,
  onRemove,
  onBulkAdd,
  isBulkAdding,
}) => {
  if (!pharmacy?.pharmacyId) return null;

  const isNearest = minDistance !== null && pharmacy.validDistance && pharmacy.distance_km === minDistance;
  const isCheapest = minTotalPrice !== null && pharmacy.trueTotalPrice === minTotalPrice;
  const itemsInCart = (pharmacy.meds || []).filter(med => med?.id && isInCart(med.id, pharmacy.pharmacyId)).length;
  const itemsNotInCart = (pharmacy.meds || []).filter(med => med?.id && !isInCart(med.id, pharmacy.pharmacyId)).length;

  return (
    <Card className="overflow-hidden bg-white pt-0 border-2 border-[#1ABA7F]/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Cover Image */}
      {pharmacy.logoUrl && (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden">
          <img
            src={pharmacy.logoUrl}
            alt={`${pharmacy.pharmacyName || 'Pharmacy'} logo`}
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
                {pharmacy.pharmacyName || 'Unknown Pharmacy'}
              </h3>
            </div>
          </div>
        </div>
      )}

      <CardContent className="pt-0 px-4 sm:p-6 space-y-4">
        {/* Header (without cover) */}
        {!pharmacy.logoUrl && (
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20">
              <Store className="h-6 w-6 text-[#225F91]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#225F91] flex-1">
              {pharmacy.pharmacyName || 'Unknown Pharmacy'}
            </h3>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-2">
          {pharmacy.address && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-sm text-gray-700 font-medium line-clamp-2 flex-1">
                {pharmacy.address}
              </span>
            </div>
          )}

          {pharmacy.operatingHours && (() => {
            const formattedHours = formatOperatingHours(pharmacy.operatingHours);
            if (!formattedHours) return null;
            return (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Clock className="h-4 w-4 text-[#225F91] flex-shrink-0" strokeWidth={2.5} />
                <span className={`text-sm font-semibold flex-1 ${getOperatingHoursTextColor(pharmacy.operatingHours)}`}>
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
              {formatDistance(pharmacy.distance_km)}
            </span>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 border border-[#1ABA7F]/30">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#225F91]" />
              <span className="text-sm font-bold text-gray-700">
                {pharmacy.medCount || 0}/{medications?.length || 0} available
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-[#225F91]">
              {formatCurrency(pharmacy.trueTotalPrice)}
            </span>
          </div>
        </div>

        {/* Medications List */}
        <div className="space-y-2">
          <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
            Medications
          </h4>

          {(pharmacy.meds || []).map(med => {
            const qty = getQty(med.id);
            const lineTotal = (med.price || 0) * qty;
            const inCart = isInCart(med.id, pharmacy.pharmacyId);
            const isLowestPrice = lowestPrices[med.id] === med.price;
            const isAddingSingle = isAddingToCart?.[`${med.id}-${pharmacy.pharmacyId}`];

            return (
              <MedicationCard
                key={med.id}
                med={med}
                pharmacy={pharmacy}
                qty={qty}
                lineTotal={lineTotal}
                inCart={inCart}
                isLowestPrice={isLowestPrice}
                isAddingSingle={isAddingSingle}
                onAddToCart={onAddToCart}
                onRemove={onRemove}
              />
            );
          })}
        </div>

        {/* Bulk Actions */}
        {medications?.length > 1 && (
          itemsNotInCart > 0 ? (
            <Button
              onClick={() => onBulkAdd(pharmacy.pharmacyId, pharmacy.meds)}
              disabled={isBulkAdding}
              className="w-full h-12 rounded-xl font-black text-base bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isBulkAdding ? (
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
});

PharmacyCard.displayName = 'PharmacyCard';

/* ----------------------------- Main Component ----------------------------- */
const PharmacyRecommendations = ({
  pharmacyRecommendations,
  medications,
  handleAddToCart,
  handleBulkAddWithDuplicateCheck,
  cart,
  isInCart,
  isAddingToCart,
  onRemoveItem,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  // Use custom hook for sorting logic
  const {
    sortOption,
    setSortOption,
    sortedPharmacies,
    lowestPrices,
    minDistance,
    minTotalPrice,
  } = usePharmacySort(pharmacyRecommendations, medications, filterOpen);

  const getQty = useCallback((medId) => {
    const medication = medications?.find(m => m?.id === medId);
    return medication?.quantity || 1;
  }, [medications]);

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

  // Bulk add with validation
  const handleBulkAdd = useCallback(async (pharmacyId, meds) => {
    if (!meds?.length) {
      toast.error('No medications to add');
      return;
    }

    try {
      // Validate and prepare items
      const itemsToAdd = meds
        .filter(med => med?.id && !isInCart(med.id, pharmacyId))
        .map(med => ({
          medicationId: med.id,
          pharmacyId,
          quantity: getQty(med.id),
        }));

      if (itemsToAdd.length === 0) {
        toast.info('All items already in cart');
        return;
      }

      // Validate parameters
      validateBulkAddParams(pharmacyId, itemsToAdd);

      // Use duplicate check if provided
      if (handleBulkAddWithDuplicateCheck) {
        await handleBulkAddWithDuplicateCheck(pharmacyId, meds);
      }
    } catch (error) {
      console.error('Bulk add validation error:', error);
      toast.error(error.message || 'Failed to add medications');
    }
  }, [isInCart, getQty, handleBulkAddWithDuplicateCheck]);

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

      {/* Pharmacy Cards or Empty States */}
      {filterOpen && sortedPharmacies.length === 0 ? (
        <NoOpenPharmaciesState onShowAll={() => setFilterOpen(false)} />
      ) : sortedPharmacies.length === 0 ? (
        <EmptyPharmaciesState />
      ) : (
        <div className="space-y-6">
          {sortedPharmacies.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.pharmacyId}
              pharmacy={pharmacy}
              medications={medications}
              getQty={getQty}
              lowestPrices={lowestPrices}
              minDistance={minDistance}
              minTotalPrice={minTotalPrice}
              isInCart={isInCart}
              isAddingToCart={isAddingToCart}
              onAddToCart={handleAddToCart}
              onRemove={handleRemove}
              onBulkAdd={handleBulkAdd}
              isBulkAdding={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyRecommendations;