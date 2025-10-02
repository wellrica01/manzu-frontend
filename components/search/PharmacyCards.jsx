import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, Clock, Shield, ChevronDown, TrendingDown, Navigation, Store, Plus, Minus, Award, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';

/* ----------------------------- Premium Sort & Filter Controls ----------------------------- */
const SortFilterBar = ({ sortOption, setSortOption, filterOpen, setFilterOpen }) => {
  const options = [
    { value: 'default', label: 'Best Deal', icon: Award },
    { value: 'cheapest', label: 'Cheapest', icon: DollarSign },
    { value: 'nearest', label: 'Nearest', icon: Navigation },
    { value: 'open', label: 'Open Now', icon: Clock, isFilter: true },
  ];

  return (
    <div className="space-y-4 mt-10 mb-10">
      {/* Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option) => {
          const isActive = option.isFilter ? filterOpen : sortOption === option.value;
          const gradientClass = option.value === 'default'
            ? "from-[#225F91] to-[#1a4a73]"
            : option.value === 'cheapest'
            ? "from-[#1ABA7F] to-[#16a876]"
            : option.value === 'nearest'
            ? "from-[#76D1F3] to-[#5bc0de]"
            : option.value === 'open'
            ? "from-[#FF6B6B] to-[#ee5a5a]"
            : "from-gray-300 to-gray-300";

          return (
            <Button
              key={option.value}
              variant="outline"
              onClick={() =>
                option.isFilter ? setFilterOpen(!filterOpen) : setSortOption(option.value)
              }
              className={cn(
                "h-12 rounded-2xl font-black transition-all duration-300 hover:scale-105 border-2 shadow-lg flex items-center justify-center",
                isActive
                  ? `bg-gradient-to-r ${gradientClass} text-white border-0 hover:shadow-xl`
                  : "bg-white text-gray-700 border-gray-300 hover:border-current hover:bg-opacity-10"
              )}
            >
              <option.icon className="h-5 w-5 mr-2" strokeWidth={2.5} />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Sort Explanation */}
      <div className="p-4 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl border-2 border-[#1ABA7F]/20">
        <p className="text-sm font-bold text-gray-700 text-center">
          {filterOpen && <span className="text-green-600">✓ Showing only open pharmacies · </span>}
          {sortOption === 'default' && 'Sorted by Most Medications Available'}
          {sortOption === 'cheapest' && 'Sorted by Cheapest Total Price'}
          {sortOption === 'nearest' && 'Sorted by Nearest Distance'}
        </p>
      </div>
    </div>
  );
};

/* ---------------------------- Pharmacy Card Header --------------------------- */
const PharmacyCardHeader = ({ avail, isNearest, isCheapest }) => (
  <div className="relative w-full h-40 sm:h-48 overflow-hidden">
    {/* Background image or gradient */}
    {avail.logoUrl ? (
      <img 
        src={avail.logoUrl} 
        alt={`${avail.pharmacyName} cover`} 
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-[#1ABA7F]/20 via-[#225F91]/20 to-[#76D1F3]/20" />
    )}
    
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    
    {/* Badges */}
    {isNearest && (
      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-[#76D1F3] to-[#5bc0de] text-white border-0 px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm">
        <Navigation className="h-3 w-3 mr-1" />
        Nearest
      </Badge>
    )}
    {isCheapest && (
      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm">
        <TrendingDown className="h-3 w-3 mr-1" />
        Cheapest
      </Badge>
    )}

    {/* Pharmacy name overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
          <HospitalIcon className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg line-clamp-1">{avail.pharmacyName}</h3>
      </div>
    </div>
  </div>
);

/* ------------------------------ Pharmacy Card ------------------------------- */
const PharmacyCard = ({
  avail,
  index,
  expandedCard,
  setExpandedCard,
  quantities,
  setQuantities,
  medId,
  displayName,
  handleAddToCart,
  isInCart,
  isAddingToCart,
}) => {
  const isExpanded = expandedCard === index;
  const currentQty = quantities[avail.pharmacyId] || 1;

  return (
    <div className={cn(
      "group overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300",
      isExpanded 
        ? "shadow-2xl border-[#1ABA7F] scale-[1.02]" 
        : "shadow-lg border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-xl"
    )}>
      <PharmacyCardHeader avail={avail} isNearest={avail.isNearest} isCheapest={avail.isCheapest} />
      
      <div className="p-5 space-y-4">
        {/* Address */}
        {avail.address && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-sm text-gray-700 font-semibold line-clamp-2">
              {avail.address}
            </p>
          </div>
        )}

        {/* Operating Hours */}
      {avail.operatingHours && (() => {
        const formattedHours = formatOperatingHours(avail.operatingHours);
        if (!formattedHours) return null;
        return (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <Clock className="h-5 w-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
            <div className="flex-1">
              <span className="text-xs font-black text-gray-600 uppercase tracking-wide block">
                Opening Hours
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  getOperatingHoursTextColor(avail.operatingHours)
                )}
              >
                {formattedHours.text}
              </span>
            </div>
          </div>
        );
      })()}

        {/* Distance & Price */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-[#76D1F3]" />
            <span className="text-sm font-semibold text-gray-700">
              {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km) 
                ? `${avail.distance_km.toFixed(1)} km` 
                : 'N/A'}
            </span>
          </div>
          <div className="text-right">
            {currentQty > 1 ? (
              <>
                <p className="text-xs text-gray-500">₦{avail.price.toLocaleString()} each</p>
                <p className="text-lg font-black text-[#225F91]">
                  ₦{(avail.price * currentQty).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">x{currentQty} units</p>
              </>
            ) : (
              <p className="text-lg font-black text-[#225F91]">
                ₦{avail.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>

{/* Quantity Controls */}
<div className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
  <label htmlFor={`qty-${avail.pharmacyId}`} className="text-sm font-semibold text-gray-700">
    Quantity:
  </label>

  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-sm">
    {/* Decrease button */}
    <button
      type="button"
      aria-label="Decrease quantity"
      onClick={() =>
        setQuantities(prev => ({
          ...prev,
          [avail.pharmacyId]: Math.max(1, (prev[avail.pharmacyId] || 1) - 1),
        }))
      }
      disabled={(quantities[avail.pharmacyId] || 1) <= 1}
      className="h-8 w-8 p-0 flex items-center justify-center hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all duration-200"
    >
      <Minus className="h-4 w-4" />
    </button>

    {/* Quantity display */}
    <span className="px-3 py-1 text-sm font-bold text-[#225F91] min-w-[2rem] text-center">
      {quantities[avail.pharmacyId] || 1}
    </span>

    {/* Increase button */}
    <button
      type="button"
      aria-label="Increase quantity"
      onClick={() =>
        setQuantities(prev => ({
          ...prev,
          [avail.pharmacyId]: (prev[avail.pharmacyId] || 1) + 1,
        }))
      }
      className="h-8 w-8 p-0 flex items-center justify-center hover:bg-[#1ABA7F]/20 text-[#225F91] rounded transition-all duration-200"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
</div>


 {/* Add to Cart Button */}
<Button
  onClick={() => handleAddToCart(
    medId, 
    avail.pharmacyId, 
    displayName,  // Add the medication name here
    quantities[avail.pharmacyId] || 1  // This is the quantity
  )}
  disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart(avail.pharmacyId)}
  className={cn(
    "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden",
    isInCart(medId, avail.pharmacyId)
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] active:scale-95"
  )}
>
  <span className="relative z-10 flex items-center gap-2">
    {isAddingToCart(avail.pharmacyId) ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        Adding...
      </>
    ) : (
      isInCart(medId, avail.pharmacyId)
        ? 'Already in Cart'
        : 'Add to Cart'
    )}
  </span>
</Button>


        {/* More Details Toggle */}
        <Button
          variant="ghost"
          onClick={() => setExpandedCard(isExpanded ? null : index)}
          className="w-full h-10 text-sm font-semibold text-[#225F91] hover:bg-[#225F91]/5 rounded-lg transition-all duration-200"
        >
          {isExpanded ? 'Show Less' : 'More Details'}
          <ChevronDown className={cn(
            "h-4 w-4 ml-2 transition-transform duration-300",
            isExpanded && "rotate-180"
          )} />
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            {avail.phone && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <Shield className="h-4 w-4 text-[#225F91] flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <a href={`tel:${avail.phone}`} className="text-sm font-bold text-[#225F91] hover:underline">
                    {avail.phone}
                  </a>
                </div>
              </div>
            )}
            {avail.email && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <Shield className="h-4 w-4 text-[#1ABA7F] flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <a href={`mailto:${avail.email}`} className="text-sm font-bold text-[#1ABA7F] hover:underline break-all">
                    {avail.email}
                  </a>
                </div>
              </div>
            )}
            {(avail.state || avail.lga || avail.ward) && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-1">Location Details</p>
                <div className="space-y-1">
                  {avail.state && <p className="text-sm font-bold text-gray-900">State: {avail.state}</p>}
                  {avail.lga && <p className="text-sm font-bold text-gray-900">LGA: {avail.lga}</p>}
                  {avail.ward && <p className="text-sm font-bold text-gray-900">Ward: {avail.ward}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------- Main Component ------------------------------ */
const PharmacyCards = ({
  availability = [],
  medId,
  handleAddToCart,
  isInCart,
  displayName,
  isAddingToCart,
  searchTerm,
  state,
  lga,
  ward,
  showSeeMore = false,
  quantity = 1,
}) => {
  const [sortOption, setSortOption] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [quantities, setQuantities] = useState({});

  // Initialize quantities when component mounts or availability changes
  useEffect(() => {
    const initialQuantities = {};
    availability.forEach(avail => {
      initialQuantities[avail.pharmacyId] = quantity;
    });
    setQuantities(initialQuantities);
  }, [availability, quantity]);

  const sortedAvailability = useMemo(() => {
    let sorted = [...availability];

    // Apply open filter
    if (filterOpen) {
      sorted = sorted.filter(avail => isPharmacyOpenNow(avail.operatingHours));
    }

    // Apply sorting
    if (sortOption === 'cheapest') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'nearest') {
      sorted.sort((a, b) => {
        const distA = typeof a.distance_km === 'number' ? a.distance_km : Infinity;
        const distB = typeof b.distance_km === 'number' ? b.distance_km : Infinity;
        return distA - distB;
      });
    }

    // Mark cheapest and nearest
    if (sorted.length > 0) {
      const cheapest = sorted.reduce((min, avail) => avail.price < min.price ? avail : min, sorted[0]);
      cheapest.isCheapest = true;

      const nearest = sorted.reduce((min, avail) => {
        const distA = typeof avail.distance_km === 'number' ? avail.distance_km : Infinity;
        const distMin = typeof min.distance_km === 'number' ? min.distance_km : Infinity;
        return distA < distMin ? avail : min;
      }, sorted[0]);
      nearest.isNearest = true;
    }

    return sorted;
  }, [availability, sortOption, filterOpen]);

  if (!availability || availability.length === 0) {
    return null;
  }

  return (
    <div className="block sm:hidden space-y-6">
      <SortFilterBar
        sortOption={sortOption}
        setSortOption={setSortOption}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
      />

      <div className="space-y-4">
        {sortedAvailability.map((avail, index) => (
          <PharmacyCard
            key={avail.pharmacyId}
            avail={avail}
            index={index}
            expandedCard={expandedCard}
            setExpandedCard={setExpandedCard}
            quantities={quantities}
            setQuantities={setQuantities}
            medId={medId}
            displayName={displayName}
            handleAddToCart={handleAddToCart}
            isInCart={isInCart}
            isAddingToCart={(pharmacyId) => isAddingToCart[pharmacyId]}
          />
        ))}
      </div>

      {showSeeMore && (
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-2 border-[#1ABA7F] text-[#225F91] font-bold hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-105"
        >
          See All Pharmacies
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default PharmacyCards;