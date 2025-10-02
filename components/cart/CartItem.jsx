import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { 
  Plus, Info, Minus, Trash2, Clock, CheckCircle, AlertCircle, FileText,
  Package, AlertTriangle, Pill, Shield, Building, Box, HospitalIcon, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CartItem = ({ 
  item, 
  handleQuantityChange, 
  setRemoveItem, 
  isUpdating, 
  calculateItemPrice,
  segment = 'ready'
}) => {
  const [showMeta, setShowMeta] = useState(false); 
  const metaRef = useRef(null);
  const [metaHeight, setMetaHeight] = useState('0px');

  useEffect(() => {
    if (metaRef.current) {
      setMetaHeight(showMeta ? `${metaRef.current.scrollHeight}px` : '0px');
    }
  }, [showMeta, item]);

  const getItemStatus = () => {
    if (item.medication?.prescriptionRequired) {
      if (item.prescriptionStatus === 'VERIFIED') {
        return {
          status: 'verified',
          icon: CheckCircle,
          color: 'text-[#1ABA7F]',
          bgColor: 'bg-[#1ABA7F]/10',
          borderColor: 'border-[#1ABA7F]/30',
          text: 'Verified',
          description: 'Ready for checkout'
        };
      } else if (item.prescriptionStatus === 'PENDING') {
        return {
          status: 'pending',
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          text: 'Under Review',
          description: 'Being verified'
        };
      } else if (item.prescriptionStatus === 'REJECTED') {
        return {
          status: 'rejected',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          text: 'Rejected',
          description: 'Upload new prescription'
        };
      } else {
        return {
          status: 'needs_prescription',
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          text: 'Prescription Required',
          description: 'Upload prescription'
        };
      }
    } else {
      return {
        status: 'ready',
        icon: Package,
        color: 'text-[#225F91]',
        bgColor: 'bg-[#225F91]/10',
        borderColor: 'border-[#225F91]/30',
        text: 'Ready',
        description: 'Available for checkout'
      };
    }
  };

  const itemStatus = getItemStatus();
  const StatusIcon = itemStatus.icon;

  const handleQuantityUpdate = (newQuantity) => {
    if (newQuantity < 1) return;
    handleQuantityChange(item.id, newQuantity, item.medication.displayName);
  };

  const handleRemove = () => {
    setRemoveItem({
      id: item.id,
      name: item.medication.displayName,
      quantity: item.quantity
    });
  };

  return (
    <Card className={cn(
      "relative bg-white/95 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl group overflow-hidden",
      itemStatus.borderColor
    )}>
      {/* Status indicator bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", itemStatus.bgColor)} />

      <div className="p-3 sm:p-4 space-y-4">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className={cn("p-2 rounded-xl", itemStatus.bgColor)}>
                <StatusIcon className={cn("h-5 w-5", itemStatus.color)} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#225F91] leading-tight mb-1">
                  {item.medication.displayName}
                </h3>
                {item.medication.ingredients && item.medication.ingredients.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {item.medication.ingredients
                      .map(ing => `${ing.activeSubstance} ${ing.strengthValue}${ing.strengthUnit}`)
                      .join(" + ")}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div>
              {item.medication.prescriptionRequired ? (
                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm">
                  <FileText className="h-3 w-3 mr-1" />
                  Prescription
                </Badge>
              ) : (
                <Badge className="bg-[#225F91]/10 text-[#225F91] border-0 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm">
                  <Package className="h-3 w-3 mr-1" />
                  OTC
                </Badge>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl flex items-center justify-center shadow-md border-2 border-gray-100 overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {item.medication.imageUrl ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <img 
                      src={item.medication.imageUrl} 
                      alt={item.medication.displayName}
                      className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-0 border-0 rounded-3xl overflow-hidden">
                    <VisuallyHidden>
                      <DialogTitle>{item.medication.displayName}</DialogTitle>
                    </VisuallyHidden>
                    <img
                      src={item.medication.imageUrl}
                      alt={item.medication.displayName}
                      className="w-full h-auto"
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <Pill className="h-12 w-12 text-[#225F91]" />
              )}
            </div>
          </div>
        </div>

        {/* Expandable Info Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMeta(!showMeta)}
            className="w-full justify-between text-[#225F91] hover:bg-[#225F91]/5 rounded-xl transition-all duration-200"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4" />
              Medication Details
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300",
              showMeta && "rotate-180"
            )} />
          </Button>

          <div
            ref={metaRef}
            style={{ maxHeight: metaHeight }}
            className="overflow-hidden transition-all duration-300 ease-in-out"
          >
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 space-y-2">
              {item.medication.genericName && (
                <div className="flex items-center gap-2 text-sm">
                  <Pill className="h-4 w-4 text-[#1ABA7F] flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Generic:</span>
                  <span className="text-gray-900 font-semibold">{item.medication.genericName}</span>
                </div>
              )}
              {item.medication.manufacturerName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-[#225F91] flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Manufacturer:</span>
                  <span className="text-gray-900 font-semibold">{item.medication.manufacturerName}</span>
                </div>
              )}
              {item.medication.nafdacCode && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-[#76D1F3] flex-shrink-0" />
                  <span className="text-gray-600 font-medium">NAFDAC:</span>
                  <span className="text-gray-900 font-semibold font-mono">{item.medication.nafdacCode}</span>
                </div>
              )}
              {item.medication.packSizeQuantity && (
                <div className="flex items-center gap-2 text-sm">
                  <Box className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Pack Size:</span>
                  <span className="text-gray-900 font-semibold">
                    {item.medication.packSizeExpression} {item.medication.packSizeUnit}
                  </span>
                </div>
              )}
              {item.medication.brandDescription && (
                <div className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 font-medium">Description:</span>
                  <span className="text-gray-900">{item.medication.brandDescription}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5 border-2 border-[#1ABA7F]/20">
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Price</span>
            {item.quantity > 1 && (
              <span className="text-sm text-[#1ABA7F] font-semibold">
                {item.quantity} × ₦{item.price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#225F91]">
            ₦{calculateItemPrice(item).toLocaleString()}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-700 mr-2">Quantity:</span>
            <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityUpdate(item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating[item.id]}
                className="h-10 w-10 p-0 hover:bg-[#1ABA7F]/10 text-[#225F91] disabled:opacity-50 rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 text-base font-bold text-[#225F91] min-w-[3rem] text-center">
                {isUpdating[item.id] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1ABA7F] border-t-transparent mx-auto"></div>
                ) : (
                  item.quantity
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityUpdate(item.quantity + 1)}
                disabled={isUpdating[item.id]}
                className="h-10 w-10 p-0 hover:bg-[#1ABA7F]/10 text-[#225F91] rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUpdating[item.id]}
            className="h-10 px-4 text-sm font-semibold hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-transparent hover:border-red-200 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CartItem;