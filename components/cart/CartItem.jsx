import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { 
  Plus, 
  Info,
  Minus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Package,
  Star,
  AlertTriangle,
  Pill,
  Calendar,
  Shield,
  Building,
  Box,
  Hospital,
  HouseIcon,
  PillIcon
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

  // Adjust max-height whenever toggle state changes
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
          borderColor: 'border-[#1ABA7F]/20',
          text: 'Verified',
          description: 'Ready for checkout'
        };
      } else if (item.prescriptionStatus === 'PENDING') {
        return {
          status: 'pending',
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          text: 'Under Review',
          description: 'Being verified'
        };
      } else if (item.prescriptionStatus === 'REJECTED') {
        return {
          status: 'rejected',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          text: 'Rejected',
          description: 'Upload new prescription'
        };
      } else {
        return {
          status: 'needs_prescription',
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
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
        borderColor: 'border-[#225F91]/20',
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
<Card
  className={cn(
    "relative bg-white/95 backdrop-blur-sm border rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg group overflow-hidden flex flex-col gap-0 pb-2",
    itemStatus.borderColor
  )}
  aria-label={`Cart item: ${item.medication.name}`}
>
  <div className="flex justify-between items-center px-4">
  <div className='flex flex-col gap-1'>
  <h3 
    className="text-lg sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight" 
    title={item.medication.displayName}
  >
    {item.medication.displayName}
  </h3>
  <div className="my-1">
    {item.medication.prescriptionRequired ? (
    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
      <FileText className="h-3 w-3 mr-1" />
      Prescription
    </Badge>
  ) : (
    <Badge className="bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
      <Package className="h-3 w-3 mr-1" />
      OTC
    </Badge>
  )}
  </div>
  </div>
      
  {/* Image */}
  <div className="relative w-24 h-24 flex">
    <div className="w-20 h-20 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl flex items-center justify-center shadow-sm">
      {item.medication.imageUrl ? (
        <Dialog>
        <DialogTrigger asChild>
          <img 
          src={item.medication.imageUrl} 
          alt={item.medication.displayName}
          className="w-18 h-18 object-cover text-xs rounded-lg border border-gray-100"
        />
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <VisuallyHidden>
                  <DialogTitle>{item.medication.displayName}</DialogTitle>
                </VisuallyHidden>
                <img
                  src={item.medication.imageUrl}
                  alt={item.medication.displayName}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </DialogContent>
            </Dialog>
      ) : (
        <Pill className="h-10 w-10 text-[#225F91]" />
      )}
    </div>
  </div>
</div>


{/* Price + Info Row */}
<div className="flex justify-between items-center px-4 py-2">
  {/* Info Toggle Button */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowMeta(!showMeta)}
    className="text-[#225F91] text-xs flex items-center gap-1"
  >
    {showMeta ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
    Medication Info
  </Button>

  {/* Price */}
  <div className="flex flex-col items-end min-w-[110px]">
    {item.quantity > 1 && (
      <div className="text-sm text-[#1ABA7F] font-medium">
        {item.quantity} × ₦{item.price.toLocaleString()}
      </div>
    )}
    <div className="text-base font-extrabold text-[#225F91]">
      ₦{calculateItemPrice(item).toLocaleString()}
    </div>
  </div>
</div>

{/* Sliding Meta Section (Below the row) */}
<div
  ref={metaRef}
  style={{ maxHeight: metaHeight }}
  className="overflow-hidden transition-max-height duration-300 ease-in-out px-4 flex flex-col gap-1 text-xs text-gray-600 mb-2"
>
  {item.medication.genericName && (
    <div className="flex items-center gap-1">
      <PillIcon className="h-3 w-3 text-[#225F91]" /> Generic: {item.medication.genericName}
    </div>
  )}
  {item.medication.manufacturerName && (
    <div className="flex items-center gap-1">
      <HouseIcon className="h-3 w-3 text-[#225F91]" /> Manufacturer: {item.medication.manufacturerName}
    </div>
  )}
  {item.medication.nafdacCode && (
    <div className="flex items-center gap-1">
      <FileText className="h-3 w-3 text-[#225F91]" /> NAFDAC Code: {item.medication.nafdacCode}
    </div>
  )}
  {item.medication.packSizeQuantity && (
    <div className="flex items-center gap-1">
      <Box className="h-3 w-3 text-[#225F91]" /> Pack: {item.medication.packSizeQuantity} {item.medication.packSizeUnit}
    </div>
  )}
    {item.medication.brandDescription && (
    <div className="flex items-center gap-1">
      <Info className="h-3 w-3 text-[#225F91]" /> Description: {item.medication.brandDescription}
    </div>
  )}
</div>


      <div className="border-t border-gray-100 my-0.5" />

      {/* Actions Section */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 rounded-b-2xl">
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Decrease quantity"
              onClick={() => handleQuantityUpdate(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating[item.id]}
              className="h-8 w-8 p-0 hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-base font-semibold text-[#225F91] min-w-[2rem] text-center">
              {isUpdating[item.id] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent mx-auto"></div>
              ) : (
                `${item.quantity}`
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Increase quantity"
              onClick={() => handleQuantityUpdate(item.quantity + 1)}
              disabled={isUpdating[item.id]}
              className="h-8 w-8 p-0 hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50 transition-all duration-200"
              title="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove item from cart"
          onClick={handleRemove}
          disabled={isUpdating[item.id]}
          className="h-8 px-3 text-xs hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-50 transition-all duration-200 group-hover:bg-red-50 font-semibold border border-transparent hover:border-red-200 rounded-lg"
          title="Remove item from cart"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remove
        </Button>
      </div>
    </Card>
  );
};

export default CartItem;