import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow  } from '@/lib/pharmacyUtils';

const PharmacyCards = ({ availability, medId, quantity = 1, handleAddToCart, isInCart, fullName, isAddingToCart, state, lga, ward, showSeeMore = false }) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [showAll, setShowAll] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

const sortedAvailability = useMemo(() => {
  if (!availability) return [];

  let filtered = availability;
  if (filterOpen) {
    filtered = availability.filter(avail => isPharmacyOpenNow(avail.operatingHours));
  }

  if (sortOption === 'cheapest') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sortOption === 'nearest') {
    return [...filtered].sort((a, b) => {
      if (isNaN(a.distance_km)) return 1;
      if (isNaN(b.distance_km)) return -1;
      return a.distance_km - b.distance_km;
    });
  }
  return filtered;
}, [availability, sortOption, filterOpen]);


  if (!availability || availability.length === 0) {
    return (
      <div className="block sm:hidden text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-base font-medium">
          No pharmacies found for {fullName}
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
    );
  }

  return (
    <div className="block sm:hidden space-y-4">
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
          className="flex-1 min-w-[90px] flex items-center justify-center gap-1"
        >
          Cheapest
        </Button>
        <Button
          variant={sortOption === 'nearest' ? 'default' : 'outline'}
          onClick={() => setSortOption('nearest')}
          className="flex-1 min-w-[90px] flex items-center justify-center gap-1"
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

      {sortedAvailability.map((avail, index) => {
        if (!showAll && index >= 3) return null; // Limit to 3 unless expanded
        const isExpanded = expandedCard === index;
        const isCheapest = avail.price === Math.min(...availability.map((a) => a.price));
        const validDistances = availability
          .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
          .map((a) => a.distance_km);
        const isNearest =
          validDistances.length > 0 &&
          typeof avail.distance_km === 'number' &&
          !isNaN(avail.distance_km) &&
          avail.distance_km === Math.min(...validDistances);

        return (
          <div
            key={index}
            className={cn(
              "overflow-hidden rounded-xl bg-white/95 border border-[#1ABA7F]/10 transition-all duration-300",
              isExpanded && "shadow-md"
            )}
          >
            {avail.logoUrl && (
              <div className="relative w-full h-32 sm:h-56 overflow-hidden rounded-t-xl">
                <img
                  src={avail.logoUrl}
                  alt={`${avail.pharmacyName} cover`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                {/* Nearest badge - top left */}
                {isNearest && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-xs bg-[#225F91]/90 text-white border border-white/30 shadow-md"
                  >
                    Nearest
                  </Badge>
                )}

                {/* Cheapest badge - top right */}
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

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-[#1ABA7F]/10 shadow-sm">
                      <HospitalIcon className="h-5 w-5 text-[#225F91]"/>
                    </div>
                    <h3 className="text-lg font-bold text-[#225F91] truncate">
                      {avail.pharmacyName}
                    </h3>
                  </div>
                  {avail.address && (
                    <div className="flex items-start gap-1 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-500 line-clamp-2">{avail.address}</p>
                    </div>
                  )}
                  {avail.operatingHours && (() => {
                    const formattedHours = formatOperatingHours(avail.operatingHours);
                    if (!formattedHours) return null;
                    return (
                      <div className="flex items-center mb-2 gap-1">
                        <span className="text-gray-500 text-xs font-semibold min-w-[60px]">Opening Hours:</span>
                        <span className={cn('text-xs font-medium', getOperatingHoursTextColor(avail.operatingHours))}>
                          {formattedHours.text}
                        </span>
                      </div>
                    );
                  })()}
                <div className="flex items-center justify-between mt-4 mb-3">
                    <span className="text-sm text-gray-600">
                      {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km)
                        ? `${avail.distance_km.toFixed(1)} km away`
                        : 'N/A'}
                    </span>

                    {quantity > 1 ? (
                      <div className="flex flex-col text-right">
                        <span className="text-sm text-gray-500">
                          ₦{avail.price.toLocaleString()} each
                        </span>
                        <span className="text-base font-bold text-gray-800">
                          ₦{(avail.price * quantity).toLocaleString()} total (x{quantity})
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-bold text-gray-800">
                        ₦{avail.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCard(isExpanded ? null : index)}
                      className="flex-1 h-10 px-3 border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? '− Details' : '+ Details'}
                    </Button>
                    <Button
                      id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                      onClick={() => handleAddToCart(medId, avail.pharmacyId, fullName)}
                      disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart[`${medId}-${avail.pharmacyId}`]}
                      className={cn(
                        'flex-1 h-10 text-sm rounded-lg transition-all duration-300',
                        isInCart(medId, avail.pharmacyId)
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                      )}
                      aria-label={isInCart(medId, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                    >
                      {isAddingToCart[`${medId}-${avail.pharmacyId}`] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        <span>{isInCart(medId, avail.pharmacyId) ? '✓ Added' : 'Add to Cart'}</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1ABA7F]/10 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <HospitalIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 font-medium">Pharmacy Info</span>
                    </div>
                    <div className="bg-[#1ABA7F]/5 rounded-lg p-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Status:</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              avail.status === 'VERIFIED'
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            )}
                          >
                            {avail.status === 'VERIFIED' ? '✓ Verified' : 'Pending Verification'}
                          </Badge>
                        </div>
                        {avail.licenseNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">License:</span>
                            <span className="text-gray-800 font-mono text-xs">{avail.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">Location Details</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                        {avail.address && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[60px]">Address:</span>
                            <span className="text-gray-800">{avail.address}</span>
                          </div>
                        )}
                        {avail.ward && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">Ward:</span>
                            <span className="text-gray-800">{avail.ward}</span>
                          </div>
                        )}
                        {avail.lga && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">LGA:</span>
                            <span className="text-gray-800">{avail.lga}</span>
                          </div>
                        )}
                        {avail.state && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">State:</span>
                            <span className="text-gray-800">{avail.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {showSeeMore && !showAll && (
        <Button
          variant="outline"
          onClick={() => setShowAll(true)}
          className="w-full mt-4 border-[#1ABA7F] text-[#225F91]"
        >
          See More Pharmacies
        </Button>
      )}
    </div>
  );
};

export default PharmacyCards;