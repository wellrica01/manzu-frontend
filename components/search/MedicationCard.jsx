import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Info, MapPin, Clock, Pill } from 'lucide-react';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import { cn } from '@/lib/utils';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart, searchTerm, state, lga, ward, isMultiMed = false }) => {
  const getAvailabilityCount = () => med.availability?.length || 0;

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
        {/* Hidden if isMultiMed */}
        {!isMultiMed && (
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
                {med.fullName || med.brandName || "Unnamed Medication"}
              </h3>

              <div className="flex items-center text-xs gap-2 mt-2 flex-wrap">
                {med.prescriptionRequired && (
                  <Badge variant="secondary" className="bg-[#225F91]/10 text-[#225F91] border-primary">
                    <Clock className="h-3 w-3 mr-1" />
                    Prescription Required
                  </Badge>
                )}

                {/* Brand name */}
                <div>
                  <span className="font-semibold text-gray-600">Brand Name:</span>
                  <span className="ml-2 text-gray-600 font-medium">{med.brandName || "N/A"}</span>
                </div>

                {/* Ingredients instead of generic name */}
                {med.ingredients?.length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-600">Ingredients:</span>
                    <span className="ml-2 text-gray-600 font-medium">
                      {med.ingredients.map(i => `${i.activeSubstance} ${i.strengthValue}${i.strengthUnit}`).join(", ")}
                    </span>
                  </div>
                )}

                {med.manufacturerName && (
                  <div>
                    <span className="text-gray-600 font-semibold">Manufacturer:</span>
                    <span className="ml-2 text-gray-600 font-medium">
                      {med.manufacturerName} - {med.manufacturerCountry}
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-gray-600">NAFDAC Code:</span>
                  <span className="ml-2 text-gray-600 font-medium">{med.nafdacCode || "N/A"}</span>
                </div>
              </div>

            </div>
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
              {med.imageUrl ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={med.imageUrl}
                      alt={med.fullName}
                      className="w-full h-full object-cover rounded-xl p-1 border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <VisuallyHidden>
                      <DialogTitle>{med.fullName}</DialogTitle>
                    </VisuallyHidden>
                    <img
                      src={med.imageUrl}
                      alt={med.fullName}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <Pill className="w-12 h-12 sm:w-20 sm:h-20 text-[#1ABA7F]/60" aria-label="Medication" />
              )}
            </div>
          </div>
            <hr className="border-t border-gray-300 mt-8" />
        </div>
           )}
      </div>
      <div className="space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#225F91]">Compare Pharmacies</h3>
          {availabilityCount > 0 && (
            <Badge variant="outline" className="border-[#1ABA7F] text-[#1ABA7F]">
              {availabilityCount} available
            </Badge>
          )}
        </div>
        {availabilityCount === 0 ? (
          <div className="block sm:hidden text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base font-medium">
              No pharmacies found for {searchTerm || med.fullName}
            </p>
            {(state || lga || ward) && (
              <p className="text-gray-400 text-base mt-2 italic">
                Location: {state}{lga ? `, ${lga}` : ''}{ward ? ` (Ward: ${ward})` : ''}
              </p>
            )}
            <p className="text-gray-400 text-sm mt-3">
              Try another location
            </p>
          </div>
        ) : (
          <>
            <PharmacyCards
              availability={isMultiMed ? med.availability.slice(0, 3) : med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              fullName={med.fullName}
              isAddingToCart={isAddingToCart}
              searchTerm={searchTerm}
              state={state}
              lga={lga}
              ward={ward}
              showSeeMore={isMultiMed && med.availability.length > 3}
              quantity={isMultiMed ? (med.quantity || 1) : 1}
            />
            {!isMultiMed && (
              <PharmacyTable
                availability={med.availability}
                medId={med.id}
                handleAddToCart={handleAddToCart}
                isInCart={isInCart}
                fullName={med.fullName}
                isAddingToCart={isAddingToCart}
                searchTerm={searchTerm}
                state={state}
                lga={lga}
                ward={ward}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicationCard;