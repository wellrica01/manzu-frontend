import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, MapPin, Clock, Pill } from 'lucide-react'; // <-- Add Pill icon import
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import { cn } from '@/lib/utils';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart }) => {
  const getAvailabilityCount = () => {
    return med.availability?.length || 0;
  };

  const getAveragePrice = () => {
    if (!med.availability?.length) return null;
    const total = med.availability.reduce((sum, avail) => sum + avail.price, 0);
    return Math.round(total / med.availability.length);
  };

  const getMinPrice = () => {
    if (!med.availability?.length) return null;
    return Math.min(...med.availability.map(avail => avail.price));
  };

  const averagePrice = getAveragePrice();
  const minPrice = getMinPrice();
  const availabilityCount = getAvailabilityCount();

  return (
    <div className="w-full space-y-4 mt-7">

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
                {med.displayName}
              </h3>
              <div className="flex items-center text-xs gap-2 mt-2 flex-wrap">
                {med.prescriptionRequired && (
                  <Badge variant="secondary" className="bg-[#225F91]/10 text-[#225F91] border-primary">
                    <Clock className="h-3 w-3 mr-1" />
                    Prescription Required
                  </Badge>
                )}
               {med.manufacturerName && (
              <div>
                <span className="text-gray-600 font-semibold">Manufacturer:</span>
                <span className="ml-2 text-gray-600">{med.manufacturerName || 'N/A'} - {med.manufacturerCountry}</span>
              </div>  )}
              <div>
                <span className="font-semibold text-gray-600">NAFDAC Code:</span>
                <span className="ml-2 text-gray-600">{med.nafdacCode || 'N/A'}</span>
              </div>
              </div>
            </div>
            {/* Medication image or fallback */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center bg-white">
              {med.imageUrl ? (
                <img
                  src={med.imageUrl}
                  alt={med.displayName}
                  className="w-full h-full object-cover rounded-xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <Pill className="w-12 h-12 sm:w-20 sm:h-20 text-[#1ABA7F]/60" aria-label="Medication" />
              )}
            </div>
          </div>
        </div>
      </div>



      <div className="space-y-4 mt-9">

        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#225F91]">Compare Pharmacies</h3>
          {availabilityCount > 0 && (
            <Badge variant="outline" className="border-[#1ABA7F] text-[#1ABA7F]">
              {availabilityCount} available
            </Badge>
          )}
        </div>

        {availabilityCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">Not available at any verified pharmacy</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your location or filters</p>
          </div>
        ) : (
          <>
            <PharmacyCards
              availability={med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
              isAddingToCart={isAddingToCart}
            />
            <PharmacyTable
              availability={med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
              isAddingToCart={isAddingToCart}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MedicationCard;