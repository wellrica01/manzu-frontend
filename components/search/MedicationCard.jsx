import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Info, MapPin, Clock, Pill, Package, Building2, Globe2, FileCheck } from 'lucide-react';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import { cn } from '@/lib/utils';

const MedicationCard = ({ 
  med, 
  handleAddToCart, 
  isInCart, 
  isAddingToCart, 
  searchTerm, 
  state, 
  lga, 
  ward, 
  isMultiMed = false 
}) => {
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
    <div className="w-full space-y-6">
{/* Medication Header */}
{!isMultiMed && (
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 border-2 border-[#1ABA7F]/20 shadow-xl py-6 px-3 sm:p-8 mb-8">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1ABA7F]/5 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#225F91]/5 to-transparent rounded-full blur-3xl" />

    <div className="relative z-10 flex flex-col gap-6">

{/* --------------------- MOBILE LAYOUT --------------------- */}
<div className="flex flex-col sm:hidden gap-4">
  {/* 1. Title (left) + Image (right) */}
  <div className="flex items-start justify-between gap-4">
    {/* Title */}
    <div className="flex-1">
      <h3 className="text-3xl font-black text-[#225F91] tracking-tight leading-tight mb-2">
        {med.displayName || med.brandName || "Unnamed Medication"}
      </h3>
      <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-transparent" />
    </div>

    {/* Image */}
    <div className="relative group flex-shrink-0 w-24 h-24">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
        {med.imageUrl ? (
          <Dialog>
            <DialogTrigger asChild>
              <img
                src={med.imageUrl}
                alt={med.displayName}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-110"
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 border-0 rounded-3xl overflow-hidden">
              <VisuallyHidden>
                <DialogTitle>{med.displayName}</DialogTitle>
              </VisuallyHidden>
              <img src={med.imageUrl} alt={med.displayName} className="w-full h-auto" />
            </DialogContent>
          </Dialog>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Pill className="w-16 h-16 text-gray-400" aria-label="Medication" />
          </div>
        )}
      </div>
    </div>
  </div>

  {/* 2. Badges Row */}
  <div className="flex flex-wrap">
    {med.prescriptionRequired && (
      <Badge className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-0 px-3 py-1.5 text-sm font-semibold shadow-lg">
        <Clock className="h-3.5 w-3.5 mr-1.5" />
        Prescription Required
      </Badge>
    )}
  </div>

  {/* 3. Info Cards Row */}
  <div className="grid grid-cols-2 gap-2">

    {med.ingredients?.length > 0 && (
      <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composition</span>
        </div>
        <p className="text-sm font-bold text-gray-900">
          {med.ingredients.map(i => `${i.activeSubstance} ${i.strengthValue}${i.strengthUnit}`).join(", ")}
        </p>
      </div>
    )}

    {med.manufacturerName && (
      <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manufacturer</span>
        </div>
        <p className="text-sm font-bold text-gray-900">{med.manufacturerName}</p>
        {med.manufacturerCountry && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Globe2 className="h-3 w-3" />
            {med.manufacturerCountry}
          </p>
        )}
      </div>
    )}

    {med.nafdacCode && (
      <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NAFDAC Code</span>
        </div>
        <p className="text-sm font-bold text-gray-900 font-mono">{med.nafdacCode}</p>
      </div>
    )}

    {med.packSizeExpression && (
      <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pack Size</span>
        </div>
        <p className="text-sm font-bold text-gray-900 font-mono">{med.packSizeExpression} {med.packSizeUnit}</p>
      </div>
    )}
  </div>
</div>

      {/* --------------------- DESKTOP LAYOUT --------------------- */}
      <div className="hidden sm:flex flex-row items-start gap-6">
        {/* Image */}
        <div className="relative group flex-shrink-0 w-40 h-40">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
            {med.imageUrl ? (
              <Dialog>
                <DialogTrigger asChild>
                  <img
                    src={med.imageUrl}
                    alt={med.displayName}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-110"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 border-0 rounded-3xl overflow-hidden">
                  <VisuallyHidden>
                    <DialogTitle>{med.displayName}</DialogTitle>
                  </VisuallyHidden>
                  <img src={med.imageUrl} alt={med.displayName} className="w-full h-auto" />
                </DialogContent>
              </Dialog>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Pill className="w-16 h-16 text-gray-400" aria-label="Medication" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          {/* Title with gradient underline */}
          <div>
            <h3 className="text-4xl font-black text-[#225F91] tracking-tight leading-tight mb-2">
              {med.displayName || med.brandName || "Unnamed Medication"}
            </h3>
            <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-transparent" />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            {med.prescriptionRequired && (
              <Badge className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-0 px-3 py-1.5 text-sm font-semibold shadow-lg">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Prescription Required
              </Badge>
            )}
          
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Brand Name */}
               
                {/* Composition */}
                {med.ingredients?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-[#225F91]" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composition</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {med.ingredients.map(i => `${i.activeSubstance} ${i.strengthValue}${i.strengthUnit}`).join(", ")}
                    </p>
                  </div>
                )}

                {/* Manufacturer */}
                {med.manufacturerName && (
                  <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-[#76D1F3]" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manufacturer</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {med.manufacturerName}
                    </p>
                    {med.manufacturerCountry && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Globe2 className="h-3 w-3" />
                        {med.manufacturerCountry}
                      </p>
                    )}
                  </div>
                )}

                {/* NAFDAC Code */}
                {med.nafdacCode && (
                  <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className="h-4 w-4 text-[#FF6B6B]" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NAFDAC Code</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 font-mono">{med.nafdacCode}</p>
                  </div>
                )}
 
                 {/*  Pack Size */}
                 {med.packSizeExpression && (
                  <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pack Size</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 font-mono">{med.packSizeExpression} {med.packSizeUnit}</p>
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Pharmacy Comparison Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10">
              <MapPin className="h-5 w-5 text-[#225F91]" />
            </div>
            <h3 className="text-xl font-black text-[#225F91]">Compare Pharmacies</h3>
          </div>
          {availabilityCount > 0 && (
            <Badge className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
              {availabilityCount} available
            </Badge>
          )}
        </div>

        {availabilityCount === 0 ? (
          <div className="block sm:hidden text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-bold mb-2">
              No pharmacies found
            </p>
            <p className="text-gray-500 text-sm">
              for {searchTerm || med.displayName}
            </p>
            {(state || lga || ward) && (
              <div className="mt-4 p-3 rounded-xl bg-gray-100">
                <p className="text-gray-600 text-sm">
                  Location: <span className="font-semibold">{state}{lga ? `, ${lga}` : ''}{ward ? ` (Ward: ${ward})` : ''}</span>
                </p>
              </div>
            )}
            <p className="text-gray-400 text-sm mt-4">
              Try adjusting your location filters
            </p>
          </div>
        ) : (
          <>
            <PharmacyCards
              availability={isMultiMed ? med.availability.slice(0, 3) : med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
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
                displayName={med.displayName}
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

      {/* Divider for non-multi-med */}
      {!isMultiMed && (
        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationCard;
