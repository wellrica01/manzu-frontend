import React from 'react';
import { Button } from '@/components/ui/button';
import { Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LabTable = ({ availability, testId, handleAddToBooking, isInBooking, displayName, isAddingToBooking }) => {
  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4">
        Not available at any verified lab
      </p>
    );
  }

  return (
    <div className="hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-describedby={`lab-comparison-${testId}`}>
          <caption id={`lab-comparison-${testId}`} className="sr-only">
            Comparison of labs for {displayName}
          </caption>
          <thead>
            <tr className="bg-[#1ABA7F]/5 text-sm font-semibold text-gray-700">
              <th className="p-4 rounded-tl-xl">Lab</th>
              <th className="p-4">Price</th>
              <th className="p-4">Distance</th>
              <th className="p-4">Home Collection</th>
              <th className="p-4">Result Time</th>
              <th className="p-4 rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody>
            {availability.map((avail, index) => {
              const validDistances = availability
                .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
                .map((a) => a.distance_km);
              const isCheapest = avail.price === Math.min(...availability.map((a) => a.price));
              const isClosest =
                validDistances.length > 0 &&
                typeof avail.distance_km === 'number' &&
                !isNaN(avail.distance_km) &&
                avail.distance_km === Math.min(...validDistances);

              const handleClick = async () => {
                try {
                  await handleAddToBooking(testId, avail.labId, displayName);
                  toast.success(`${displayName} added to booking!`);
                } catch (error) {
                  toast.error('Failed to add to booking.');
                }
              };

              return (
                <tr
                  key={index}
                  className="border-t border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10 transition-colors duration-200"
                >
                  <td className="p-4">
                    <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                      {avail.labName}
                    </p>
                    {avail.address && (
                      <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">
                        {avail.address}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-800">
                        ₦{avail.price.toLocaleString()}
                      </span>
                      {isCheapest && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#1ABA7F] bg-[#1ABA7F]/10 rounded-full animate-bounce">
                          Cheapest
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km) ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base text-gray-600">
                          {avail.distance_km.toFixed(1)} km
                        </span>
                        {isClosest && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#225F91] bg-[#225F91]/10 rounded-full animate-bounce">
                            Closest
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-base">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    {avail.homeCollectionAvailable ? (
                      <span className="text-[#1ABA7F] font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-base text-gray-600">
                      {avail.resultTurnaroundHours || 'N/A'} hours
                    </span>
                  </td>
                  <td className="p-4">
                    <Button
                      id={`add-to-booking-${testId}-${avail.labId}`}
                      onClick={handleClick}
                      disabled={isInBooking(testId, avail.labId) || isAddingToBooking[`${testId}-${avail.labId}`]}
                      className={cn(
                        'h-10 px-5 text-sm font-semibold rounded-full transition-all duration-300',
                        isInBooking(testId, avail.labId)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] animate-pulse'
                      )}
                      aria-label={isInBooking(testId, avail.labId) ? 'Added to booking' : 'Add to booking'}
                    >
                      {isAddingToBooking[`${testId}-${avail.labId}`] ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <Microscope className="h-5 w-5 mr-2" aria-hidden="true" />
                      )}
                      {isInBooking(testId, avail.labId) ? 'Added' : 'Add to Booking'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabTable;