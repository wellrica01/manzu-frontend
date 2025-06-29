import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const PharmacyTable = React.memo(({ availability, medId, handleAddToCart, isInCart, displayName, isAddingToCart }) => {
  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4">
        Not available at any verified pharmacy
      </p>
    );
  }

  return (
    <div className="hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-describedby={`pharmacy-comparison-${medId}`}>
          <caption id={`pharmacy-comparison-${medId}`} className="sr-only">
            Comparison of pharmacies for {displayName}
          </caption>
          <thead>
            <tr className="bg-[#1ABA7F]/10 text-sm font-semibold text-[#225F91]">
              <th className="p-4 rounded-tl-xl">Pharmacy</th>
              <th className="p-4">Price</th>
              <th className="p-4">Distance</th>
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
              return (
                <tr
                  key={index}
                  className="border-t border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10 transition-colors duration-200"
                >
                  <td className="p-4">
                    <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                      {avail.pharmacyName}
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
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#1ABA7F] bg-[#1ABA7F]/20 rounded-full">
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
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-[#225F91] bg-[#225F91]/20 rounded-full">
                            Closest
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-base">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Button
                      id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(medId, avail.pharmacyId, displayName);
                      }}
                      disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart[`${medId}-${avail.pharmacyId}`]}
                      className={cn(
                        'h-10 px-5 text-base font-semibold rounded-full transition-all duration-300',
                        isInCart(medId, avail.pharmacyId)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                      )}
                      aria-label={isInCart(medId, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                    >
                      {isAddingToCart[`${medId}-${avail.pharmacyId}`] ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                      )}
                      {isInCart(medId, avail.pharmacyId) ? 'Added' : 'Add to Cart'}
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
});

export default PharmacyTable;