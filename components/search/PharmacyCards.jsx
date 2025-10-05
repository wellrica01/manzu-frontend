import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, Clock, Shield, ChevronDown, TrendingDown, Navigation, Store, Trash2, Plus, Minus, Award, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';
import UnifiedRemoveDialog from '@/components/cart/UnifiedRemoveDialog';
import { toast } from 'sonner';


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
          <Store className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-white font-bold text-xl">{avail.pharmacyName}</h3>
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
  cart,
  isInCart,
  isAddingToCart,
  onRemoveFromCart,
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
      
      <div className="px-3 pt-4 pb-8 space-y-4">
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
          <div className="flex items-center gap-3 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
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
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200">
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
      <div className="flex items-center justify-between px-2 py-2 rounded-xl border-2 border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
        <label
          htmlFor={`qty-${avail.pharmacyId}`}
          className="text-sm font-semibold text-gray-700"
        >
          Quantity:
        </label>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-sm">
          {/* Decrease button */}
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() =>
              setQuantities((prev) => ({
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
              setQuantities((prev) => ({
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


      {/* Add to Cart / Remove Buttons */}
      <div className="flex gap-2">
        {isInCart(medId, avail.pharmacyId) ? (
          <>
            {/* Already in Cart Badge */}
            <Button
              disabled
              className="flex-1 h-12 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 border-2 border-gray-300 cursor-not-allowed"
            >
              Already in Cart
            </Button>
            
            {/* Remove Button */}
            <Button
              onClick={() => {
                // Find the cart item for this medication from this pharmacy
                const cartItem = cart?.pharmacies
                  ?.find(p => p.pharmacy.id === avail.pharmacyId)
                  ?.items?.find(item => item.medication.id === medId);
                
                if (cartItem) {
                  onRemoveFromCart({
                    id: cartItem.id,
                    name: displayName,
                    quantity: cartItem.quantity
                  });
                }
              }}
              variant="outline"
              className="h-12 px-4 rounded-xl font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300 group"
            >
              <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => handleAddToCart(
              medId, 
              avail.pharmacyId, 
              displayName,  
              avail.pharmacyName,
              quantities[avail.pharmacyId] || 1 
            )}
            disabled={isAddingToCart(avail.pharmacyId)}
            className={cn(
              "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden",
              "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] active:scale-95"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isAddingToCart(avail.pharmacyId) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                'Add to Cart'
              )}
            </span>
          </Button>
        )}
      </div>
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
  cart, 
  onRemoveFromCart,
  guestId, 
  fetchCart, 
}) => {
  const [sortOption, setSortOption] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [removeItemDialog, setRemoveItemDialog] = useState(null);

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

// Check if filter is active but no results
const noOpenPharmacies = filterOpen && sortedAvailability.length === 0;

  return (
    <div className="block sm:hidden space-y-6">
      <SortFilterBar
        sortOption={sortOption}
        setSortOption={setSortOption}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
      />

      {/* Empty state for no open pharmacies */}
    {noOpenPharmacies && (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-red-200">
        <div className="bg-white p-4 rounded-full shadow-lg mb-4">
          <Clock className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
          No Pharmacies Currently Open
        </h3>
        <p className="text-sm text-gray-600 text-center mb-4">
          All pharmacies offering this medication are currently closed.
        </p>
        <Button
          onClick={() => setFilterOpen(false)}
          className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white rounded-xl px-6 py-2 font-bold hover:shadow-lg transition-all duration-300"
        >
          Show All Pharmacies
        </Button>
      </div>
    )}

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
            onRemoveFromCart={(item) => setRemoveItemDialog(item)}
            cart={cart}
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

     <UnifiedRemoveDialog
        removeItem={removeItemDialog}
        bulkRemoveItems={null}
        onClose={() => setRemoveItemDialog(null)}
        onConfirm={async () => {
          if (!removeItemDialog?.id) return;
          
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${removeItemDialog.id}`, {
              method: 'DELETE',
              headers: { 'x-guest-id': guestId },
            });
            await fetchCart();
            setRemoveItemDialog(null);
            toast.success('Item removed from cart');
          } catch (error) {
            console.error('Remove error:', error);
            toast.error('Failed to remove item');
          }
        }}
        isRemoving={false}
      />
    </div>
  );
};

export default PharmacyCards;