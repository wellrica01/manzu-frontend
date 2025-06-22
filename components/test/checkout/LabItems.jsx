import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const LabItems = ({ bookings, calculateItemPrice, testOrderStatuses }) => {
  return (
    <>
      {bookings.labs.map((lab) => (
        <div key={lab.lab.id} className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{lab.lab.name}</h3>
          {lab.items.map((item) => (
            <div key={item.id} className="mb-4 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-gray-900 text-sm sm:text-base font-medium">{item.test.name}</p>
                {item.test.orderRequired && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                          Test Order Required
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This test requires a valid test order, which will be verified before processing.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Price: ₦{calculateItemPrice(item).toLocaleString()}</p>
            </div>
          ))}
          <p className="text-gray-900 text-sm sm:text-base font-semibold">
            Subtotal: ₦{lab.subtotal.toLocaleString()}
          </p>
        </div>
      ))}
    </>
  );
};

export default LabItems;