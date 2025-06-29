import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ProviderCards = ({ availability, serviceId, handleAddToOrder, isInOrder, isMedication, displayName, isAddingToOrder }) => {
  const [quantity, setQuantity] = useState(1);

  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4 block sm:hidden">
        Not available at any verified {isMedication ? 'pharmacy' : 'lab'}
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
          <Card key={index} className="p-4 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-lg shadow-md transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="flex justify-between items-center">
              <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {avail.providerName}
              </p>
              <Button
                id={`add-to-order-${serviceId}-${avail.providerId}`}
                onClick={() => handleAddToOrder(serviceId, avail.providerId, displayName, isMedication ? quantity : undefined)}
                disabled={isInOrder(serviceId, avail.providerId) || isAddingToOrder[`${serviceId}-${avail.providerId}`]}
                className={cn(
                  'h-10 px-4 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105',
                  isInOrder(serviceId, avail.providerId)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)]'
                )}
                aria-label={isInOrder(serviceId, avail.providerId) ? `Added to ${isMedication ? 'cart' : 'booking'}` : `Add to ${isMedication ? 'cart' : 'booking'}`}
              >
                {isAddingToOrder[`${serviceId}-${avail.providerId}`] ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" aria-hidden="true" />
                ) : isMedication ? (
                  <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                ) : (
                  <Microscope className="h-5 w-5 mr-2" aria-hidden="true" />
                )}
                {isInOrder(serviceId, avail.providerId) ? 'Added' : 'Add'}
              </Button>
            </div>
            {avail.address && (
              <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">{avail.address}</p>
            )}
            {isMedication && (
              <div className="mt-2">
                <label htmlFor={`quantity-${serviceId}-${avail.providerId}`} className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                  Quantity
                </label>
                <input
                  id={`quantity-${serviceId}-${avail.providerId}`}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1 w-16 p-1 border border-[#1ABA7F]/20 rounded-md text-center text-base"
                  aria-label={`Quantity for ${avail.providerName}`}
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-base font-bold text-gray-800">₦{avail.price.toLocaleString()}</span>
              {isCheapest && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#1ABA7F] bg-[#1ABA7F]/10 rounded-full animate-bounce">
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
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#225F91] bg-[#225F91]/10 rounded-full animate-bounce">
                  Closest
                </span>
              )}
            </div>
            {!isMedication && (
              <div className="flex items-center gap-2 mt-1">
                {avail.homeCollectionAvailable && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#1ABA7F] bg-[#1ABA7F]/10 rounded-full">
                    Home Collection
                  </span>
                )}
              </div>
            )}
            {!isMedication && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base text-gray-600">
                  Results in {avail.resultTurnaroundHours || 'N/A'} hours
                </span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ProviderCards;