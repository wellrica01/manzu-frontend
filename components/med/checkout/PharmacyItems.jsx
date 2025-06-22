import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const PharmacyItems = ({ cart, calculateItemPrice, prescriptionStatus }) => {
  return (
    <>
      {cart.pharmacies.map((pharmacy) => (
        <div key={pharmacy.pharmacy.id} className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{pharmacy.pharmacy.name}</h3>
          {pharmacy.items.map((item) => (
            <div key={item.id} className="mb-4 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-gray-900 text-sm sm:text-base font-medium">{item.medication.displayName}</p>
                {item.medication.prescriptionRequired && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                          Prescription Required
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This medication requires a valid prescription, which will be verified before processing.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Quantity: {item.quantity}</p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Unit Price: ₦{item.price.toLocaleString()}</p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
            </div>
          ))}
          <p className="text-gray-900 text-sm sm:text-base font-semibold">
            Subtotal: ₦{pharmacy.subtotal.toLocaleString()}
          </p>
        </div>
      ))}
    </>
  );
};

export default PharmacyItems;