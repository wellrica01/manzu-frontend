import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PharmacyCards = ({ availability, medId, handleAddToCart, isInCart, displayName, isAddingToCart }) => {
  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4 block sm:hidden">
        Not available at any verified pharmacy
      </p>
    );
  }

  return (
    <div className="block sm:hidden space-y-4">
      {availability.map((avail, index) => {
        const validDistances = useMemo(() => {
          return availability
            .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
            .map((a) => a.distance_km);
        }, [availability]);

        const isCheapest = useMemo(() => {
          return avail.price === Math.min(...availability.map((a) => a.price));
        }, [availability, avail.price]);

        const isClosest = useMemo(() => {
          return (
            validDistances.length > 0 &&
            typeof avail.distance_km === 'number' &&
            !isNaN(avail.distance_km) &&
            avail.distance_km === Math.min(...validDistances)
          );
        }, [validDistances, avail.distance_km]);

        return (
          <Card key={index} className="p-4 border border-gray-100/50 rounded-xl">
            <div className="flex justify-between items-center">
              <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {avail.pharmacyName}
              </p>
              <Button
                id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                onClick={() => handleAddToCart(medId, avail.pharmacyId, displayName)}
                disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart[`${medId}-${avail.pharmacyId}`]}
                className={cn(
                  'h-8 px-3 text-sm rounded-full',
                  isInCart(medId, avail.pharmacyId)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                )}
                aria-label={isInCart(medId, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
              >
                {isAddingToCart[`${medId}-${avail.pharmacyId}`] ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : null}
                {isInCart(medId, avail.pharmacyId) ? 'Added' : 'Add'}
              </Button>
            </div>
            {avail.address && (
              <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">{avail.address}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-gray-800">₦{avail.price.toLocaleString()}</span>
              {isCheapest && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-green-600 bg-green-100 rounded-full animate-bounce">
                  Cheapest
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base text-gray-600">
                {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km)
                  ? `${avail.distance_km.toFixed(1)} km`
                  : 'N/A'}
              </span>
              {isClosest && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-bounce">
                  Closest
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PharmacyCards;