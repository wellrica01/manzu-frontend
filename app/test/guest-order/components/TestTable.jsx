import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const LabTable = ({ availability, testId, handleAddToCart, isInCart, name }) => {
  if (!availability || availability.length === 0) {
    return (
      <p className="text-gray-500 text-base italic p-4 hidden sm:block">
        Not available at any verified lab
      </p>
    );
  }

  return (
    <div className="hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-describedby={`lab-comparison-${testId}`}>
          <caption id={`lab-comparison-${testId}`} className="sr-only">
            Comparison of labs for {name}
          </caption>
          <thead>
            <tr className="bg-primary/5 text-sm font-semibold text-gray-700">
              <th className="p-4 rounded-tl-xl">Lab</th>
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
                  className="border-t border-gray-100/50 hover:bg-primary/10 transition-colors duration-200"
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
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-green-600 bg-green-100 rounded-full animate-bounce">
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
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-bounce">
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
                      id={`add-to-cart-${testId}-${avail.labId}`}
                      onClick={() => handleAddToCart(testId, avail.labId, name)}
                      disabled={isInCart(testId, avail.labId)}
                      className={cn(
                        'h-10 px-5 text-sm font-semibold rounded-full transition-all duration-300',
                        isInCart(testId, avail.labId)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse'
                      )}
                      aria-label={isInCart(testId, avail.labId) ? 'Added to cart' : 'Add to cart'}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                      {isInCart(testId, avail.labId) ? 'Added' : 'Add to Cart'}
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