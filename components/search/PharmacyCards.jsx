import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, Clock, Shield, ShoppingCart, ChevronDown, TrendingDown, Navigation, Store, Trash2, Plus, Minus, Award, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';
import UnifiedRemoveDialog from '@/components/cart/UnifiedRemoveDialog';
import { toast } from 'sonner';


/* ----------------------------- Premium Sort & Filter Controls ----------------------------- */
const SortFilterBar = ({ sortOption, setSortOption, filterOpen, setFilterOpen }) => {
  const [hoveredOption, setHoveredOption] = useState(null);
  
  const options = [
    { value: 'default', label: 'Best Deal', icon: Award },
    { value: 'cheapest', label: 'Cheapest', icon: DollarSign },
    { value: 'nearest', label: 'Nearest', icon: Navigation },
    { value: 'open', label: 'Open Now', icon: Clock, isFilter: true },
  ];

  return (
    <div className="space-y-4 mt-10 mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Buttons Grid with stagger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option, index) => {
          const isActive = option.isFilter ? filterOpen : sortOption === option.value;
          const isHovered = hoveredOption === option.value;
          
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
              onClick={() => {
                option.isFilter ? setFilterOpen(!filterOpen) : setSortOption(option.value);
              }}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              className={cn(
                "h-12 rounded-2xl font-black transition-all duration-300 border-2 shadow-lg relative overflow-hidden group animate-in zoom-in-95",
                isActive
                  ? `bg-gradient-to-r ${gradientClass} text-white border-0 shadow-2xl scale-105` 
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:scale-105"
              )}
              style={{ 
                animationDelay: `${index * 80}ms`,
                animationDuration: '400ms'
              }}
            >
              {/* Shine effect on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0"
              )} />
              
              <option.icon className={cn(
                "h-5 w-5 mr-2 transition-transform duration-300",
                isActive && "scale-110"
              )} strokeWidth={2.5} />
              
              <span className="relative z-10">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Explanation bar */}
      <div className="p-4 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl border-2 border-[#1ABA7F]/20 animate-in fade-in slide-in-from-bottom-2 duration-500" 
           style={{ animationDelay: '400ms' }}>
        <p className="text-sm font-bold text-gray-700 text-center">
          {filterOpen && (
            <span className="inline-flex items-center gap-2 text-green-600 animate-in fade-in duration-300">
              <Clock className="h-4 w-4 animate-pulse" />
              Showing only open pharmacies
            </span>
          )}
          {!filterOpen && sortOption === 'default' && 'Sorted by Most Medications Available'}
          {!filterOpen && sortOption === 'cheapest' && 'Sorted by Cheapest Total Price'}
          {!filterOpen && sortOption === 'nearest' && 'Sorted by Nearest Distance'}
        </p>
      </div>
    </div>
  );
};

/* ----------------------------- No Open Pharmacies Empty State ----------------------------- */
const NoOpenPharmaciesState = ({ onShowAll }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-red-200 animate-in fade-in zoom-in-95 duration-500">
    <div className="bg-white p-4 rounded-full shadow-lg mb-4 animate-in zoom-in-50" style={{ animationDelay: '200ms' }}>
      <Clock className="h-10 w-10 text-red-500 animate-pulse" />
    </div>
    <h3 className="text-lg font-bold text-center text-gray-800 mb-2 animate-in slide-in-from-bottom-2" style={{ animationDelay: '300ms' }}>
      No Pharmacies Currently Open
    </h3>
    <p className="text-sm text-gray-600 text-center mb-4 animate-in fade-in" style={{ animationDelay: '400ms' }}>
      All pharmacies offering this medication are currently closed.
    </p>
    <Button
      onClick={onShowAll}
      className="bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white rounded-lg px-6 py-2 font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 animate-in zoom-in-95" 
      style={{ animationDelay: '500ms' }}
    >
      Show All Pharmacies
    </Button>
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isExpanded = expandedCard === index;
  const key = `${medId}-${avail.pharmacyId}`;
  const adding = !!isAddingToCart[key];
  const currentQty = quantities[avail.pharmacyId] || 1;

  return (
    <div className={cn(
      "group overflow-hidden rounded-2xl bg-white border-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
      isExpanded 
        ? "shadow-2xl border-[#1ABA7F] scale-[1.02]" 
        : "shadow-lg border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-2xl hover:scale-[1.01]"
    )}
    style={{
      animationDelay: `${index * 120}ms`,
      animationDuration: '500ms'
    }}>
      {/* Enhanced header with image load animation */}
      <div className="relative w-full h-40 sm:h-48 overflow-hidden">
        {avail.logoUrl ? (
          <>
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            <img 
              src={avail.logoUrl} 
              alt={`${avail.pharmacyName} cover`} 
              className={cn(
                "w-full h-full object-cover transition-all duration-700",
                isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1ABA7F]/20 via-[#225F91]/20 to-[#76D1F3]/20 animate-gradient bg-300%" />
        )}
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Badges with entrance animation */}
        {avail.isNearest && (
          <Badge className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#225F91] text-white border-2 border-white text-xs font-bold shadow-lg backdrop-blur-sm animate-in slide-in-from-left-2 duration-500" 
                 style={{ animationDelay: `${index * 120 + 200}ms` }}>
            <Navigation className="h-3 w-3 mr-1 animate-pulse" />
            Nearest
          </Badge>
        )}
        {avail.isCheapest && (
          <Badge className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#1ABA7F] text-white border-2 border-white text-xs font-bold shadow-lg backdrop-blur-sm animate-in slide-in-from-right-2 duration-500" 
                 style={{ animationDelay: `${index * 120 + 300}ms` }}>
            <TrendingDown className="h-3 w-3 mr-1 animate-pulse" />
            Cheapest
          </Badge>
        )}

        {/* Pharmacy name with slide animation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent animate-in slide-in-from-bottom-2 duration-500" 
             style={{ animationDelay: `${index * 120 + 400}ms` }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
              <Store className="h-5 w-5 text-white" strokeWidth={2}/>
            </div>
            <h3 className="text-white font-bold text-xl">{avail.pharmacyName}</h3>
          </div>
        </div>
      </div>
      
      <div className="px-3 pt-4 pb-8 space-y-2">
        {/* Address with icon animation */}
        {avail.address && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
               style={{ animationDelay: `${index * 120 + 500}ms` }}>
            <MapPin className="h-4 w-4 text-[#1ABA7F] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
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
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
              style={{ animationDelay: `${index * 120 + 600}ms` }}>
          <Clock className="h-4 w-4 text-[#225F91] flex-shrink-0" strokeWidth={2} />
            <span className={cn('text-sm font-bold flex-1', getOperatingHoursTextColor(avail.operatingHours))}>
              {formattedHours.text}
            </span>
              {formattedHours.status === 'open' && (
                <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs">
                  Open
                </Badge>
              )}
            </div>
          );
        })()}

        {/* Distance & Price with number animation */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-[#1ABA7F]/30 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-right-2" 
             style={{ animationDelay: `${index * 120 + 700}ms` }}>
          <div className="flex items-center gap-2 text-gray-700">
            <Navigation className="h-4 w-4 text-[#76D1F3]" />

            {avail.distance_km != null ? (
              <span className="text-sm font-semibold">
                {avail.distance_km < 1
                  ? `${Math.round(avail.distance_km * 1000)} m`
                  : `${avail.distance_km.toFixed(1)} km`}
                {avail.distance_minutes != null && (
                  <span className="text-gray-500 font-normal ml-1">
                    • {avail.distance_minutes} min{avail.distance_minutes > 1 ? 's' : ''}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-400">N/A</span>
            )}
          </div>

          <div className="text-right">
            {currentQty > 1 ? (
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500">₦{avail.price.toLocaleString()} each</p>
                <div className="transition-all duration-300 ease-out">
                  <p className="text-lg font-black text-[#225F91]">
                    ₦{(avail.price * currentQty).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500">x{currentQty} units</p>
              </div>
            ) : (
              <p className="text-lg font-black text-[#225F91]">
                ₦{avail.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Quantity Controls */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg border-2 border-gray-200 hover:border-[#1ABA7F]/50 transition-all duration-300 animate-in fade-in zoom-in-95" 
             style={{ animationDelay: `${index * 120 + 800}ms` }}>
          <label htmlFor={`qty-${avail.pharmacyId}`} className="text-sm font-semibold text-gray-700">
            Quantity:
          </label>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg shadow-sm">
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
              className="h-6 w-6  flex items-center justify-center hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50 disabled:cursor-not-allowed rounded active:scale-90 transition-all duration-200"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 text-sm font-bold text-[#225F91] min-w-[2rem] text-center transition-all duration-200">
              {quantities[avail.pharmacyId] || 1}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQuantities((prev) => ({
                  ...prev,
                  [avail.pharmacyId]: (prev[avail.pharmacyId] || 1) + 1,
                }))
              }
              className="h-6 w-6 flex items-center justify-center hover:bg-[#1ABA7F]/20 text-[#225F91] rounded active:scale-90 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Enhanced Buttons with smooth transitions */}
        <div className="flex gap-2 animate-in fade-in zoom-in-95" 
             style={{ animationDelay: `${index * 120 + 900}ms` }}>
          {isInCart(medId, avail.pharmacyId) ? (
            <>
              <Button
                disabled
                className="flex-1 h-12 rounded-lg font-bold text-sm bg-gray-100 text-gray-600 border-2 border-gray-300 cursor-not-allowed"
              >
                Already in Cart
              </Button>
              
              <Button
                onClick={() => {
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
                className="h-12 px-4 rounded-lg font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:scale-110 transition-all duration-300 group"
              >
                <Trash2 className="h-4 w-4 group-hover:scale-125 transition-transform duration-300" />
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
              disabled={adding}
              className={cn(
                "w-full h-12 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden",
                "bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:from-[#1a4a73] hover:to-[#225F91] active:scale-95 hover:scale-105"
              )}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <span className="relative z-10 flex items-center gap-2 justify-center">
                {adding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  <>
                 <ShoppingCart className="h-4 w-4 mr-2" strokeWidth={2} />
                  Add to Cart
                  </>
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
        const distA = typeof a.distance_meters === 'number' ? a.distance_meters : Infinity;
        const distB = typeof b.distance_meters === 'number' ? b.distance_meters : Infinity;
        return distA - distB;
      });
    }

    // Mark cheapest and nearest
    if (sorted.length > 0) {
      const cheapest = sorted.reduce((min, avail) => avail.price < min.price ? avail : min, sorted[0]);
      cheapest.isCheapest = true;

      const nearest = sorted.reduce((min, avail) => {
        const distA = typeof avail.distance_meters === 'number' ? avail.distance_meters : Infinity;
        const distMin = typeof min.distance_meters === 'number' ? min.distance_meters : Infinity;
        return distA < distMin ? avail : min;
      }, sorted[0]);
      nearest.isNearest = true;
    }

    return sorted;
  }, [availability, sortOption, filterOpen]);

  // Check if filter is active but no results
  const noOpenPharmacies = filterOpen && sortedAvailability.length === 0;

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

      {/* Show empty state when filter is active but no open pharmacies */}
      {noOpenPharmacies ? (
        <NoOpenPharmaciesState onShowAll={() => setFilterOpen(false)} />
      ) : (
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
              isAddingToCart={isAddingToCart}
            />
          ))}
        </div>
      )}

      {showSeeMore && !noOpenPharmacies && (
        <Button
          variant="outline"
          className="w-full h-12 rounded-lg border-2 border-[#1ABA7F] text-[#225F91] font-bold hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-105"
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