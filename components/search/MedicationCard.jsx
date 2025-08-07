import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, MapPin, Clock } from 'lucide-react';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import { cn } from '@/lib/utils';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart }) => {
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="w-full space-y-4">
      <div className="bg-[#1ABA7F]/5 px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-[#225F91]" />
              <span className="text-gray-600">{availabilityCount} pharmacies</span>
            </div>
            {minPrice && (
              <div className="flex items-center gap-1">
                <span className="text-[#1ABA7F] font-semibold">From ₦{minPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[#225F91] hover:text-[#1A4971] hover:bg-[#225F91]/10"
          >
            <Info className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
                {med.displayName}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-base text-gray-700 font-medium">
                  {med.form ? med.form.charAt(0) + med.form.slice(1).toLowerCase() : ''}
                  {med.strengthValue && med.strengthUnit ? ` • ${med.strengthValue}${med.strengthUnit}` : ''}
                </span>
                {med.prescriptionRequired && (
                  <Badge variant="secondary" className="bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Prescription Required
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {med.genericName || 'Generic N/A'}
                </span>
              </div>
              {med.manufacturer && (
                <div className="text-sm text-gray-400 mt-1">Manufacturer: {med.manufacturer}</div>
              )}
            </div>
            {med.imageUrl && (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                <img
                  src={med.imageUrl}
                  alt={med.displayName}
                  className="w-full h-full object-cover rounded-xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
          </div>
          {showDetails && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">NAFDAC Code:</span>
                  <span className="ml-2 text-gray-600">{med.nafdacCode || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Form:</span>
                  <span className="ml-2 text-gray-600">{med.form || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Strength:</span>
                  <span className="ml-2 text-gray-600">{med.strengthValue && med.strengthUnit ? `${med.strengthValue}${med.strengthUnit}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Manufacturer:</span>
                  <span className="ml-2 text-gray-600">{med.manufacturer || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#225F91]">Compare Pharmacies</h3>
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