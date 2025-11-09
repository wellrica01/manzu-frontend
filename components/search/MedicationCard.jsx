'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Info, MapPin, Clock, Pill, Building2, Globe2, FileCheck } from 'lucide-react';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import LocationPrompt from './LocationPrompt';
import FilterControls from './FilterControls';

const smoothScrollToElement = (selector, offset = 100, duration = 600) => {
  const element = document.querySelector(selector);
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

const MedicationCard = ({ 
  guestId,
  fetchCart,
  med, 
  handleAddToCart, 
  cart,
  isInCart, 
  isAddingToCart, 
  searchTerm, 
  state, 
  lga, 
  ward, 
  locationStatus, 
  progress,
  accuracy,
  error,
  onSelectLocation,
  onEnableLocation,
  isLoadingLocation,
  onCancelLocation,
  permissionDenied,
  isMultiMed = false,
  states,
  lgas,
  wards,
  geoData,
  updateLgas,
  updateWards,
  clearFilters,
  setFilterState,
  setFilterLga,
  showFilters,
  setShowFilters, 
  filtersWereSet,
}) => {
  const getAvailabilityCount = () => med.availability?.length || 0;
  const [removeItemDialog, setRemoveItemDialog] = useState(null);

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
        <div className="relative rounded-3xl bg-gradient-to-br from-white to-gray-50 border-2 border-[#1ABA7F]/20 shadow-xl py-4 sm:py-6 px-4 sm:px-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Animated decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1ABA7F]/5 to-transparent rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#225F91]/5 to-transparent rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '4s', animationDelay: '1s' }} />

          {/* Rest of your header content with stagger delays */}
          <div className="relative z-10 flex flex-col gap-6">
            {/* Mobile Layout */}
            <div className="flex flex-col sm:hidden gap-4">
              {/* Title + Image with animation */}
              <div className="flex items-start justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                {/* Title */}
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-[#225F91] tracking-tight leading-tight mb-2">
                    {med.displayName || med.brandName || "Unnamed Medication"}
                  </h3>
                  <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-transparent animate-in slide-in-from-left-2 duration-700" 
                      style={{ animationDelay: '200ms' }} />
                </div>

                {/* Image with hover effect */}
                <div className="relative group flex-shrink-0 w-24 h-24 animate-in zoom-in-50 duration-500" 
                    style={{ animationDelay: '300ms' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500" />
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 group-hover:rotate-2 transition-all duration-500">
                    {med.imageUrl ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <img
                            src={med.imageUrl}
                            alt={med.displayName}
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-125"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-0 border-0 rounded-3xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
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

              {/* Badges with stagger */}
              {med.prescriptionRequired && (
                <div className="flex flex-wrap animate-in fade-in slide-in-from-bottom-2 duration-500" 
                    style={{ animationDelay: '400ms' }}>
                  <Badge className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-0 text-xs sm:text-sm px-2 sm:px-3 py-1 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Prescription Required
                  </Badge>
                </div>
              )}

              {/* Info Cards with stagger */}
              <div className="grid grid-cols-2 gap-2">
              {med.ingredients?.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composition</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 space-y-1">
                      {med.ingredients.map((i, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-[#1ABA7F] font-extrabold">•</span>
                          <span>{i.activeSubstance} {i.strengthValue}{i.strengthUnit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {med.manufacturerName && (
                  <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95" 
                      style={{ animationDelay: '600ms' }}>
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
                  <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95" 
                      style={{ animationDelay: '700ms' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NAFDAC Code</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 font-mono">{med.nafdacCode}</p>
                  </div>
                )}

                {med.packSizeExpression && (
                  <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95" 
                      style={{ animationDelay: '800ms' }}>
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
                  <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composition</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 space-y-1">
                      {med.ingredients.map((i, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-[#1ABA7F] font-extrabold">•</span>
                          <span>{i.activeSubstance} {i.strengthValue}{i.strengthUnit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                    {/* Manufacturer */}
                    {med.manufacturerName && (
                      <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
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
                      <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCheck className="h-4 w-4 text-[#FF6B6B]" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NAFDAC Code</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 font-mono">{med.nafdacCode}</p>
                      </div>
                    )}
    
                    {/*  Pack Size */}
                    {med.packSizeExpression && (
                      <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
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
      <div className="space-y-4" >

      {/* ✅ Add FilterControls here */}
        {!isMultiMed && (
          <FilterControls
            filterState={state}
            setFilterState={setFilterState}
            filterLga={lga}
            setFilterLga={setFilterLga}
            filterWard={ward}
            states={states}
            lgas={lgas}
            wards={wards}
            geoData={geoData}
            updateLgas={updateLgas}
            updateWards={updateWards}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        )}

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10">
              <MapPin className="h-5 w-5 text-[#225F91]" />
            </div>
            <h3 className="text-xl font-black text-[#225F91]">Compare Pharmacies</h3>
          </div>
        {/* ✅ Show badge ONLY when location prompt is NOT showing */}
        {filtersWereSet && availabilityCount > 0 && (
          <Badge className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
            {availabilityCount} available
          </Badge>
        )}
        </div>

      {/* Check if location is needed */}
      {!filtersWereSet ? (
        <LocationPrompt
          onSelectLocation={onSelectLocation}
          onEnableLocation={onEnableLocation}
          onCancelLocation={onCancelLocation}
          locationStatus={locationStatus}
          progress={progress}
          accuracy={accuracy}
          error={error}
          isLoadingLocation={isLoadingLocation}
          permissionDenied={permissionDenied} 
        />
      ) : availabilityCount === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
                {/* Animated Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6 animate-in zoom-in-50 duration-700" 
                style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" 
                  style={{ animationDuration: '2s' }} />
            <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl">
              <MapPin className="h-12 w-12 text-teal-600 animate-bounce" 
                      style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
              {/* Title with slide animation */}
              <h3 className="text-2xl font-black text-[#225F91] mb-3 animate-in slide-in-from-bottom-2 duration-500" 
                  style={{ animationDelay: '300ms' }}>
                No pharmacies found
              </h3>
        
              {/* Description */}
              <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed animate-in fade-in duration-500" 
                  style={{ animationDelay: '400ms' }}>
              No pharmacies found for <strong>{searchTerm || med.displayName}</strong> in your selected location.
              </p>
        
              {/* Location Used */}

              {(state || lga || ward) && (
                <div className="mt-4 p-3 rounded-lg bg-gray-100">
                  <p className="text-gray-600 text-sm font-bold">
                    Chosen Location: {state}{lga ? `, ${lga}` : ''}{ward ? `, ${ward}` : ''}
                  </p>
                </div>
              )}

              {/* Helper Text */}
            <p className="text-xs text-gray-500 mt-6 animate-in fade-in duration-500" 
              style={{ animationDelay: '700ms' }}>
              Try a different location or broader area to find available pharmacies.
            </p>
        </div>
      ) : (
        <>
          <PharmacyCards
            availability={isMultiMed ? med.availability.slice(0, 3) : med.availability}
            medId={med.id}
            cart={cart}
            onRemoveFromCart={(item) => setRemoveItemDialog(item)}
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
            guestId={guestId} 
            fetchCart={fetchCart}
          />
          
          {/*
              {!isMultiMed && (
            <PharmacyTable
              availability={med.availability}
              medId={med.id}
              cart={cart}
              onRemoveFromCart={(item) => setRemoveItemDialog(item)}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
              isAddingToCart={isAddingToCart}
              searchTerm={searchTerm}
              state={state}
              lga={lga}
              ward={ward}
              guestId={guestId} 
              fetchCart={fetchCart}
            />
          )}
          
          */}

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
