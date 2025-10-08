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


const PharmacyCartCard = ({ 
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

  return (
    <Card className={cn(
      "bg-white border-2 rounded-2xl transition-shadow duration-200 pt-0",
      segment === 'ready' ? "border-[#1ABA7F]/30" : "border-orange-300",
      "hover:shadow-lg"
    )}>
      {/* Cover Photo */}
      {pharmacy.pharmacy.logoUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
          <img
            src={pharmacy.pharmacy.logoUrl}
            alt={pharmacy.pharmacy.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Pharmacy Name */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                <Store className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-black text-white flex-1">
                {pharmacy.pharmacy.name}
              </h3>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="h-10 w-10 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", expanded && "rotate-180")} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="p-4 space-y-3">
        {/* Pharmacy Name (no cover) */}
        {!pharmacy.pharmacy.logoUrl && (
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 rounded-xl bg-[#1ABA7F]/10">
                <Store className="h-6 w-6 text-[#225F91]" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-black text-[#225F91]">
                {pharmacy.pharmacy.name}
              </h3>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "h-10 w-10 rounded-lg",
                expanded ? "bg-[#1ABA7F]/10 text-[#1ABA7F]" : "bg-gray-100 text-gray-600"
              )}
            >
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", expanded && "rotate-180")} strokeWidth={2} />
            </Button>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-2">
          {pharmacy.pharmacy.address && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5" strokeWidth={2} />
              <span className="text-sm text-gray-700 line-clamp-2 flex-1">
                {pharmacy.pharmacy.address}
              </span>
            </div>
          )}

          {formattedHours && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-4 w-4 text-[#225F91]" strokeWidth={2} />
              <span className={cn('text-sm font-semibold flex-1', getOperatingHoursTextColor(pharmacy.pharmacy.operatingHours))}>
                {formattedHours.text}
              </span>
              {formattedHours.status === 'open' && (
                <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs">
                  Open
                </Badge>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1ABA7F]/10 border border-[#1ABA7F]/30">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#225F91]" strokeWidth={2} />
              <span className="text-sm font-bold text-gray-700">
                {pharmacy.items.length} {pharmacy.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-lg font-black text-[#225F91]">
              ₦{pharmacyTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-0 space-y-3">
          {pharmacy.items.map((item, index) => (
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
                <Separator className="my-3 bg-gray-200" />
              )}
            </div>
          ))}

          {/* Total */}
          {pharmacy.items.length > 1 && (
            <div className="pt-4 mt-3 border-t-2 border-gray-200">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#225F91]/10 border-2 border-[#225F91]/30">
                <span className="text-base font-bold text-gray-700">
                  Pharmacy Total:
                </span>
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