import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, HospitalIcon, Clock, Shield, ShoppingCart, ChevronDown, TrendingDown, Navigation, Store, Trash2, Plus, Minus, Award, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';
import UnifiedRemoveDialog from '@/components/cart/UnifiedRemoveDialog';
import { toast } from 'sonner';


// Sort & Filter Bar
const SortFilterBar = ({ sortOption, setSortOption, filterOpen, setFilterOpen }) => {
  const options = [
    { value: 'default', label: 'Best Deal', icon: Award, gradient: 'from-blue-600 to-indigo-600' },
    { value: 'cheapest', label: 'Cheapest', icon: DollarSign, gradient: 'from-emerald-600 to-teal-600' },
    { value: 'nearest', label: 'Nearest', icon: Navigation, gradient: 'from-cyan-600 to-blue-600' },
    { value: 'open', label: 'Open Now', icon: Clock, gradient: 'from-rose-600 to-pink-600', isFilter: true },
  ];

return (
  <div className="space-y-4 sm:space-y-6">
    {/* Filter + Sort Buttons */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      {options.map((option, index) => {
        const isActive = option.isFilter ? filterOpen : sortOption === option.value;

        return (
          <Button
            key={option.value}
            variant="outline"
            onClick={() =>
              option.isFilter
                ? setFilterOpen(!filterOpen)
                : setSortOption(option.value)
            }
            className={cn(
              "relative h-10 sm:h-14 rounded-lg sm:rounded-2xl font-extrabold transition-all duration-500 border-2 overflow-hidden group animate-in zoom-in-95 text-sm sm:text-base",
              isActive
                ? `bg-gradient-to-r ${option.gradient} text-white border-0 shadow-xl sm:shadow-2xl scale-105`
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:scale-[1.03] hover:shadow-lg"
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Hover Shine Effect */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-opacity duration-500",
                isActive ? "opacity-0" : "opacity-0 group-hover:opacity-100"
              )}
            />

            {/* Icon */}
            <option.icon
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 transition-transform duration-300",
                isActive && "animate-pulse"
              )}
              strokeWidth={2.5}
            />

            {/* Label */}
            <span className="relative z-10">{option.label}</span>
          </Button>
        );
      })}
    </div>

    {/* Active Filter/Sort Display */}
    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-200">
      <p className="text-xs sm:text-sm font-bold text-gray-700 text-center leading-snug sm:leading-relaxed">
        {filterOpen && (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 text-emerald-600">
            <Clock className="h-4 w-4 animate-pulse" strokeWidth={2.5} />
            Showing only open pharmacies
          </span>
        )}
        {!filterOpen && sortOption === "default" && (
          <span>✨ Sorted by Most Medications Available</span>
        )}
        {!filterOpen && sortOption === "cheapest" && (
          <span>💰 Sorted by Cheapest Total Price</span>
        )}
        {!filterOpen && sortOption === "nearest" && (
          <span>📍 Sorted by Nearest Distance</span>
        )}
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
      className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg px-6 py-2 font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 animate-in zoom-in-95" 
      style={{ animationDelay: '500ms' }}
    >
      Show All Pharmacies
    </Button>
  </div>
);

// Pharmacy Card
const PharmacyCard = ({
  avail,
  index,
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
  const key = `${medId}-${avail.pharmacyId}`;
  const adding = !!isAddingToCart[key];
  const currentQty = quantities[avail.pharmacyId] || 1;
  const isOpen = avail.operatingHours && avail.operatingHours.includes('Open');

  return (
    <div className={cn(
        "group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
        "shadow-md hover:shadow-2xl hover:scale-[1.015] border-gray-200 hover:border-emerald-300"
      )}

    style={{ animationDelay: `${index * 120}ms` }}>
      {/* Premium header */}
      <div className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden">
        {avail.logoUrl ? (
          <>
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            <img 
              src={avail.logoUrl} 
              alt={avail.pharmacyName} 
              className={cn(
                "w-full h-full object-cover transition-all duration-700",
                isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-cyan-100 to-blue-100" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Badges */}
        {avail.isNearest && (
          <Badge className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-black text-xs shadow-xl border-2 border-white backdrop-blur-sm animate-in slide-in-from-left-2" 
                 style={{ animationDelay: `${index * 120 + 200}ms` }}>
            <Navigation className="h-3 w-3 mr-1 animate-pulse" strokeWidth={2.5} />
            Nearest
          </Badge>
        )}
        {avail.isCheapest && (
          <Badge className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xl border-2 border-white backdrop-blur-sm animate-in slide-in-from-right-2" 
                 style={{ animationDelay: `${index * 120 + 300}ms` }}>
            <TrendingDown className="h-3 w-3 mr-1 animate-pulse" strokeWidth={2.5} />
            Cheapest
          </Badge>
        )}

        {/* Pharmacy name */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
              <Store className="h-6 w-6 text-white" strokeWidth={2}/>
            </div>
            <h3 className="text-white font-black text-lg sm:text-xl leading-tight line-clamp-2">{avail.pharmacyName}</h3>
          </div>
        </div>
      </div>
      
     <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">

        {/* Address */}
        {avail.address && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors duration-300">
            <MapPin className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-sm text-gray-700 font-semibold leading-relaxed">
              {avail.address}
            </p>
          </div>
        )}

        {/* Operating hours */}
      {avail.operatingHours && (() => {
        const formattedHours = formatOperatingHours(avail.operatingHours);
        if (!formattedHours) return null;
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Clock className="h-4 w-4 text-[#225F91] flex-shrink-0" strokeWidth={2} />
            <span className={cn('text-sm font-bold flex-1', getOperatingHoursTextColor(avail.operatingHours))}>
              {formattedHours.text}
            </span>
            {formattedHours.status === 'open' && (
              <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs">Open</Badge>
            )}
          </div>
        );
      })()}



        {/* Distance & Price */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center gap-2 text-gray-700">
            <Navigation className="h-5 w-5 text-cyan-500" strokeWidth={2.5} />
            <span className="text-sm font-bold">
              {avail.distance_km != null
                ? avail.distance_km < 1
                  ? `${Math.round(avail.distance_km * 1000)}m`
                  : `${avail.distance_km.toFixed(1)}km`
                : 'N/A'}
            </span>
          </div>

          <div className="text-right">
            {currentQty > 1 ? (
              <div>
                <p className="text-xs text-gray-500">₦{avail.price.toLocaleString()} each</p>
                <p className="text-base font-black text-gray-900">
                  ₦{(avail.price * currentQty).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">×{currentQty} units</p>
              </div>
            ) : (
              <p className="text-base font-black text-gray-900">
                ₦{avail.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Quantity controls */}
      <div className="w-full flex items-center justify-between bg-gray-100 rounded-lg shadow-sm px-3 py-0.5 border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300">
        
        {/* Label */}
        <label className="text-sm font-black text-gray-700">
          Quantity:
        </label>

        {/* Controls */}
        <div className="flex items-center bg-gray-100 rounded-lg">
          <button
            onClick={() =>
              setQuantities((prev) => ({
                ...prev,
                [avail.pharmacyId]: Math.max(1, (prev[avail.pharmacyId] || 1) - 1),
              }))
            }
            disabled={(quantities[avail.pharmacyId] || 1) <= 1}
            className="h-8 w-8 flex items-center justify-center hover:bg-emerald-100 text-gray-700 disabled:opacity-50 rounded-lg active:scale-90 transition-all duration-200"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="px-4 py-2 text-sm font-black text-gray-900 min-w-[3rem] text-center">
            {quantities[avail.pharmacyId] || 1}
          </span>

          <button
            onClick={() =>
              setQuantities((prev) => ({
                ...prev,
                [avail.pharmacyId]: (prev[avail.pharmacyId] || 1) + 1,
              }))
            }
            className="h-8 w-8 flex items-center justify-center hover:bg-emerald-100 text-gray-700 rounded-lg active:scale-90 transition-all duration-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

      </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {isInCart(medId, avail.pharmacyId) ? (
            <>
              <Button
                disabled
                className="flex-1 h-13 rounded-xl font-bold bg-gray-100 text-gray-600 border-2 border-gray-300 cursor-not-allowed"
              >
                In Cart
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
                className="h-13 px-5 rounded-xl font-bold border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                <Trash2 className="h-5 w-5" strokeWidth={2.5} />
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
              className="relative w-full h-13 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white active:scale-95 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <span className="relative z-10 flex items-center gap-2 justify-center">
                {adding ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
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
    <div className="block space-y-6">
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