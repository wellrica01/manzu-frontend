import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatOperatingHours, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';
import { 
  MapPin, 
  Clock, 
  ChevronDown,
  Package,
  Store
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

  const pharmacyTotal = useMemo(() => {
    return pharmacy.items.reduce((total, item) => total + calculateItemPrice(item), 0);
  }, [pharmacy.items, calculateItemPrice]);

  const formattedHours = useMemo(() => {
    return pharmacy.pharmacy.operatingHours
      ? formatOperatingHours(pharmacy.pharmacy.operatingHours)
      : null;
  }, [pharmacy.pharmacy.operatingHours]);

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
          <Separator className="my-3 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        )}
      </div>
    ));
  }, [pharmacy.items, handleQuantityChange, setRemoveItem, isUpdating, calculateItemPrice, segment, selectionMode, isSelected, onToggleSelect]);

  return (
    <Card className={cn(
      "relative overflow-hidden bg-white border-2 pt-0 rounded-2xl shadow-lg transition-all duration-300",
      segment === 'ready' ? "border-[#1ABA7F]/30" : "border-orange-300",
      "hover:shadow-xl"
    )}>
      {/* Cover Photo with Overlay */}
      {pharmacy.pharmacy.logoUrl && (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden">
          <img
            src={pharmacy.pharmacy.logoUrl}
            alt={`${pharmacy.pharmacy.name} cover`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Pharmacy Name on Cover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                <Store className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg flex-1">
                {pharmacy.pharmacy.name}
              </h3>
              
              {/* Collapse button on image */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  "h-10 w-10 rounded-lg transition-all duration-300 backdrop-blur-md border flex-shrink-0",
                  expanded 
                    ? "bg-white/20 text-white border-white/30 hover:bg-white/30" 
                    : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                )}
                aria-label={expanded ? "Collapse items" : "Expand items"}
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className={cn(
        "p-4 sm:p-6 space-y-3",
        !pharmacy.pharmacy.logoUrl && "pt-6"
      )}>
        {/* Pharmacy Name if no cover photo */}
        {!pharmacy.pharmacy.logoUrl && (
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20">
                <Store className="h-5 w-5 sm:h-6 sm:w-6 text-[#225F91]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#225F91] flex-1 min-w-0">
                {pharmacy.pharmacy.name}
              </h3>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "h-10 w-10 rounded-lg transition-all duration-300 flex-shrink-0",
                expanded 
                  ? "bg-[#1ABA7F]/20 text-[#1ABA7F] hover:bg-[#1ABA7F]/30" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              aria-label={expanded ? "Collapse items" : "Expand items"}
            >
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
            </Button>
          </div>
        )}

        {/* Pharmacy Info */}
        <div className="space-y-2">
          {/* Address */}
          {pharmacy.pharmacy.address && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2 flex-1">
                {pharmacy.pharmacy.address}
              </span>
            </div>
          )}

          {/* Operating Hours */}
          {formattedHours && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-4 w-4 text-[#225F91] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={cn('text-xs sm:text-sm font-semibold', getOperatingHoursTextColor(pharmacy.pharmacy.operatingHours))}>
                  {formattedHours.text}
                </span>
              </div>
              {formattedHours.status === 'open' && (
                <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
                  Open
                </Badge>
              )}
            </div>
          )}

          {/* Summary Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 border border-[#1ABA7F]/30">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#225F91]" />
              <span className="text-sm font-bold text-gray-700">
                {pharmacy.items.length} {pharmacy.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-[#225F91]">
              ₦{pharmacyTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {cartItemsList}

          {/* Pharmacy Total */}
          {pharmacy.items.length > 1 && (
            <div className="pt-4 mt-3 border-t-2 border-gray-200">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 border-2 border-[#225F91]/30">
                <span className="text-sm sm:text-base font-bold text-gray-700">
                  Pharmacy Total:
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#225F91]">
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