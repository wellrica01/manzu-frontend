import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LabCards = ({ availability, testId, handleAddToCart, isInCart, name }) => {
  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4 block sm:hidden">
        Not available at any verified lab
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
                {avail.labName}
              </p>
              <Button
                id={`add-to-cart-${testId}-${avail.labId}`}
                onClick={() => handleAddToCart(testId, avail.labId, name)}
                disabled={isInCart(testId, avail.labId)}
                className={cn(
                  'h-8 px-3 text-sm rounded-full',
                  isInCart(testId, avail.labId)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                )}
                aria-label={isInCart(testId, avail.labId) ? 'Added to cart' : 'Add to cart'}
              >
                {isInCart(testId, avail.labId) ? 'Added' : 'Add'}
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

export default LabCards;