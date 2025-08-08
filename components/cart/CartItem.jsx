import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
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
  HouseIcon
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
    handleQuantityChange(item.id, newQuantity, item.medication.name);
  };

  const handleRemove = () => {
    setRemoveItem({
      id: item.id,
      name: item.medication.name,
      quantity: item.quantity
    });
  };

  return (
    <Card
      className={cn(
        "relative bg-white/95 backdrop-blur-sm border rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg group overflow-hidden flex flex-col gap-0 p-0",
        itemStatus.borderColor
      )}
      aria-label={`Cart item: ${item.medication.name}`}
    >
     <div className="flex items-center gap-4 p-5 pb-0">
    
        {/* Details Section */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-[#225F91] text-lg" title={item.medication.displayName}>{item.medication.displayName}</h3>
          </div>
          {item.medication.genericName && (
            <div className="text-sm text-gray-600 italic mb-0.5">
              Generic: {item.medication.genericName}
            </div>
          )}
         {item.medication.description && (
            <div className="text-sm text-gray-600 mb-0.5 line-clamp-2">
              {item.medication.description}
            </div>
          )}
          {/* Status & Badges */}
          <div className="flex items-center gap-2 mt-1 mb-1.5">
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
          {/* Meta with Icons */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-0.5">
            {item.medication.packSizeQuantity && (
              <div className="flex items-center gap-1">
                <Box className="h-3 w-3 text-[#225F91]" />
                <span>Pack: {item.medication.packSizeQuantity} {item.medication.packSizeUnit || ''}</span>
              </div>
            )}
            {item.medication.manufacturer && (
              <div className="flex items-center gap-1">
                <HouseIcon className="h-3 w-3 text-[#225F91]" />
                <span className="truncate">Manufacturer: {item.medication.manufacturer}</span>
              </div>
            )}
            {item.medication.nafdacCode && (
              <div className="flex items-center gap-1 text-gray-600">
                <FileText className="h-3 w-3 text-[#225F91]" />
                <span>NAFDAC Code: {item.medication.nafdacCode}</span>
              </div>
            )}
          </div>
        </div>
          {/* Image & Status Overlay */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl flex items-center justify-center shadow-sm">
            {item.medication.imageUrl ? (
              <img 
                src={item.medication.imageUrl} 
                alt={item.medication.name}
                className="w-16 h-16 object-cover rounded-lg border border-gray-100"
              />
            ) : (
              <Pill className="h-10 w-10 text-[#225F91]" />
            )}
          </div>
          {/* Status Indicator Overlay */}
          <div className={cn(
            "absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 shadow bg-white",
            itemStatus.bgColor,
            itemStatus.borderColor
          )} title={itemStatus.text}>
            <StatusIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
      {/* Divider */}
      {/* Price Section */}
      <div className="flex justify-end">
        <div className="p-3 flex flex-col min-w-[110px] items-end">
          {item.quantity > 1 && (
            <div className="text-sm text-[#1ABA7F] font-medium mt-0.5">
              {item.quantity} × ₦{item.price.toLocaleString()}
            </div>
          )}
          <div className="text-base font-extrabold text-[#225F91] leading-tight">
            ₦{calculateItemPrice(item).toLocaleString()}
          </div>
        </div>
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