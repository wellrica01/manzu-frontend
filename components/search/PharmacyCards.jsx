import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';

const PharmacyCards = ({ availability, medId, handleAddToCart, isInCart, displayName, isAddingToCart }) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [sortOption, setSortOption] = useState('default'); // 🔹 default = backend smart order

  // 🔹 Apply sorting logic
  const sortedAvailability = useMemo(() => {
    if (!availability) return [];

    if (sortOption === 'cheapest') {
      return [...availability].sort((a, b) => a.price - b.price);
    }

    if (sortOption === 'closest') {
      return [...availability].sort((a, b) => {
        if (isNaN(a.distance_km)) return 1;
        if (isNaN(b.distance_km)) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return availability; // 🔹 backend order stays untouched
  }, [availability, sortOption]);

  if (!availability || availability.length === 0) {
    return (
      <div className="block sm:hidden text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">Not available at any verified pharmacy</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your location or filters</p>
      </div>
    );
  }

  return (
    <div className="block sm:hidden space-y-4">
      {/* 🔹 Sorting buttons */}

<div className="flex flex-wrap gap-2 mb-4">
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
    variant={sortOption === 'closest' ? 'default' : 'outline'}
    onClick={() => setSortOption('closest')}
    className="flex-1 min-w-[90px] flex items-center justify-center gap-1"
  >
    Closest
  </Button>
</div>

<div className="mb-4 text-sm text-gray-600 font-medium">
  {sortOption === 'default' && "Get The Best Deals"}
  {sortOption === 'cheapest' && "Sorted by Cheapest"}
  {sortOption === 'closest' && "Sorted by Closest"}
</div>


      {/* 🔹 Render sorted cards */}
      {sortedAvailability.map((avail, index) => {
        const isExpanded = expandedCard === index;

        const isCheapest = avail.price === Math.min(...availability.map((a) => a.price));
        const validDistances = availability
          .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
          .map((a) => a.distance_km);
        const isClosest =
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
              {/* 🔹 Cover Photo */}
              {avail.logoUrl && (
                <div className="relative w-full h-28 overflow-hidden rounded-t-xl">
                  <img
                    src={avail.logoUrl}
                    alt={`${avail.pharmacyName} cover`}
                    className="w-full h-full object-cover"
                  />
                  {/* Optional: gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <HospitalIcon className="h-4 w-4 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {avail.pharmacyName}
                    </h3>
                  </div>
                  {avail.address && (
                    <div className="flex items-start gap-1 mb-2">
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-500 line-clamp-2">{avail.address}</p>
                    </div>
                  )}
                   {avail.operatingHours && (() => {
                      const formattedHours = formatOperatingHours(avail.operatingHours);
                      if (!formattedHours) return null;
                        return (
                          <div className="flex items-start text-xs mb-2 gap-2">
                            <span className="text-gray-500 min-w-[60px]">Operating Hours:</span>
                            <span className={cn('font-bold', getOperatingHoursTextColor(avail.operatingHours))}>
                            {formattedHours.status === 'unknown' ? avail.operatingHours : formattedHours.text}</span>
                          </div>
                        );
                      })()}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km)
                          ? `${avail.distance_km.toFixed(1)} km`
                          : 'N/A'}
                      </span>
                      {isClosest && (
                        <Badge variant="secondary" className="text-xs bg-[#225F91]/20 text-[#225F91] border-[#225F91]/30">
                          Closest
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       {isCheapest && (
                        <Badge variant="secondary" className="text-xs bg-[#1ABA7F]/20 text-[#1ABA7F] border-[#1ABA7F]/30">
                          Cheapest
                        </Badge>
                      )}
                      <span className="text-base font-bold text-gray-800">₦{avail.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                   <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCard(isExpanded ? null : index)}
                      className="flex-1 h-10 px-3 border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? '−' : '+'}
                    </Button>
                    <Button
                      id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                      onClick={() => handleAddToCart(medId, avail.pharmacyId, displayName)}
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
    </div>
  );
};

export default PharmacyCards;