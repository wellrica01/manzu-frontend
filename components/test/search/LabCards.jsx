import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Microscope } from 'lucide-react';
import { toast } from 'sonner';

const LabCards = ({ availability, testId, handleAddToBooking, isInBooking, displayName, isAddingToBooking }) => {
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

        const handleClick = async () => {
          try {
            await handleAddToBooking(testId, avail.labId, displayName);
            toast.success(`${displayName} added to booking!`);
          } catch (error) {
            toast.error('Failed to add to booking.');
          }
        };

        return (
          <Card key={index} className="p-4 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-md">
            <div className="flex justify-between items-center">
              <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {avail.labName}
              </p>
              <Button
                id={`add-to-booking-${testId}-${avail.labId}`}
                onClick={handleClick}
                disabled={isInBooking(testId, avail.labId) || isAddingToBooking[`${testId}-${avail.labId}`]}
                className={cn(
                  'h-8 px-3 text-sm font-semibold rounded-full',
                  isInBooking(testId, avail.labId)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)]'
                )}
                aria-label={isInBooking(testId, avail.labId) ? 'Added to booking' : 'Add to booking'}
              >
                {isAddingToBooking[`${testId}-${avail.labId}`] ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <Microscope className="h-4 w-4 mr-1" aria-hidden="true" />
                )}
                {isInBooking(testId, avail.labId) ? 'Added' : 'Add'}
              </Button>
            </div>
            {avail.address && (
              <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">{avail.address}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
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
            <div className="flex items-center gap-2 mt-1">
              {avail.homeCollectionAvailable && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#1ABA7F] bg-[#1ABA7F]/10 rounded-full">
                  Home Collection
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base text-gray-600">
                Results in {avail.resultTurnaroundHours || 'N/A'} hours
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default LabCards;