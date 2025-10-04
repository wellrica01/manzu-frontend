import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatOperatingHours, getOperatingHoursTextColor, isPharmacyOpenNow } from '@/lib/pharmacyUtils';
import { 
  MapPin, 
  Clock, 
  Hospital,
  ChevronDown,
  Package
} from 'lucide-react';
import CartItem from './CartItem';
import { cn } from '@/lib/utils';

export const PharmacyCartCard = ({ 
  pharmacy, 
  handleQuantityChange, 
  setRemoveItem, 
  isUpdating, 
  calculateItemPrice,
  segment = 'ready',
  selectionMode = false,     
  isSelected = () => false, 
  onToggleSelect = () => {} 
}) => {
  const [expanded, setExpanded] = useState(true);

  // Memoized total calculation
  const pharmacyTotal = useMemo(() => {
    return pharmacy.items.reduce((total, item) => total + calculateItemPrice(item), 0);
  }, [pharmacy.items, calculateItemPrice]);

  // Memoized formatted hours
  const formattedHours = useMemo(() => {
    return pharmacy.pharmacy.operatingHours
      ? formatOperatingHours(pharmacy.pharmacy.operatingHours)
      : null;
  }, [pharmacy.pharmacy.operatingHours]);

  // Memoized CartItem list for performance
  const cartItemsList = useMemo(() => {
    return pharmacy.items.map((item, index) => (
      <div key={item.id}>
      <CartItem
        item={item}
        handleQuantityChange={handleQuantityChange}
        setRemoveItem={setRemoveItem}
        isUpdating={isUpdating}
        calculateItemPrice={calculateItemPrice}
        segment={segment}
        selectionMode={selectionMode}
        isSelected={isSelected(item.id)}
        onToggleSelect={onToggleSelect}
      />
        {index < pharmacy.items.length - 1 && (
          <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        )}
      </div>
    ));
  }, [pharmacy.items, handleQuantityChange, setRemoveItem, isUpdating, calculateItemPrice, segment]);

  // Expand/collapse button classes
  const expandButtonClass = cn(
    "h-12 w-12 rounded-xl transition-all duration-300 shadow-md flex-shrink-0",
    expanded ? "bg-[#1ABA7F]/20 text-[#1ABA7F] hover:bg-[#1ABA7F]/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  );
  const expandIconClass = cn("w-6 h-6 transition-transform duration-300", expanded && "rotate-180");

  return (
    <Card className={cn(
      "relative overflow-hidden bg-white border-2 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group",
      segment === 'ready' ? "border-[#1ABA7F]/30" : "border-orange-300"
    )}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/10 to-transparent rounded-tr-full" />

      {/* Cover Photo */}
      {pharmacy.pharmacy.logoUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={pharmacy.pharmacy.logoUrl}
            alt={`${pharmacy.pharmacy.name} cover`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
                <Hospital className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white drop-shadow-lg">
                {pharmacy.pharmacy.name}
              </h3>
            </div>
          </div>
        </div>
      )}

      <CardHeader className={cn(
        "relative z-10 bg-gradient-to-r from-[#1ABA7F]/10 via-[#225F91]/5 to-transparent p-3 sm:p-6",
        !pharmacy.pharmacy.logoUrl && "pt-8"
      )}>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Pharmacy Name if no cover photo */}
            {!pharmacy.pharmacy.logoUrl && (
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 shadow-md">
                  <Hospital className="h-6 w-6 text-[#225F91]" />
                </div>
                <CardTitle className="text-2xl font-black text-[#225F91] tracking-tight">
                  {pharmacy.pharmacy.name}
                </CardTitle>
              </div>
            )}

            <div className="space-y-3">
              {/* Address */}
              {pharmacy.pharmacy.address && (
                <div className="flex items-start gap-3 p-2 sm:p-3 rounded-xl bg-white/80 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <MapPin className="h-5 w-5 text-[#1ABA7F] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium line-clamp-2">
                    {pharmacy.pharmacy.address}
                  </span>
                </div>
              )}

              {/* Operating Hours */}
              {formattedHours && (
                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-xl bg-gradient-to-r from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Clock className="h-5 w-5 text-[#225F91] flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Hours: </span>
                    <span className={cn('text-sm font-bold', getOperatingHoursTextColor(pharmacy.pharmacy.operatingHours))}>
                      {formattedHours.text}
                    </span>
                  </div>
                  {formattedHours.status === 'open' && (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-2 py-1 text-xs font-bold shadow-md">
                      Open
                    </Badge>
                  )}      
                </div>
              )}

              {/* Pharmacy Summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 border border-[#1ABA7F]/20">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#225F91]" />
                  <span className="text-sm font-bold text-gray-700">
                    {pharmacy.items.length} {pharmacy.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <span className="text-lg font-black text-[#225F91]">
                  ₦{pharmacyTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className={expandButtonClass}
            aria-label={expanded ? "Collapse items" : "Expand items"}
          >
            <ChevronDown className={expandIconClass} />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="relative z-10 p-2 sm:p-6 animate-in slide-in-from-top-2 duration-300">
          {cartItemsList}

          {/* Pharmacy Total */}
          {pharmacy.items.length > 1 && (
            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 border-2 border-[#225F91]/20 shadow-sm">
                <span className="text-base font-bold text-gray-700">Pharmacy Total:</span>
                <span className="text-2xl font-black text-[#225F91]">
                  ₦{pharmacyTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PharmacyCartCard;
