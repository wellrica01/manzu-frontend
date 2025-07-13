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
  Edit3
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
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);

  const getItemStatus = () => {
    if (item.medication?.prescriptionRequired) {
      if (item.prescriptionStatus === 'verified') {
        return {
          status: 'verified',
          icon: CheckCircle,
          color: 'text-[#1ABA7F]',
          bgColor: 'bg-[#1ABA7F]/10',
          borderColor: 'border-[#1ABA7F]/20',
          text: 'Verified',
          description: 'Ready for checkout'
        };
      } else if (item.prescriptionStatus === 'pending') {
        return {
          status: 'pending',
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          text: 'Under Review',
          description: 'Being verified'
        };
      } else if (item.prescriptionStatus === 'rejected') {
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
    setShowQuantityDialog(false);
  };

  const handleRemove = () => {
    setRemoveItem({
      id: item.id,
      name: item.medication.name,
      quantity: item.quantity
    });
  };

  return (
    <Card className={cn(
      "bg-white/95 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md",
      itemStatus.borderColor
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Enhanced Item Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl flex items-center justify-center shadow-sm">
              {item.medication.image ? (
                <img 
                  src={item.medication.image} 
                  alt={item.medication.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <Package className="h-8 w-8 text-[#225F91]" />
              )}
            </div>
          </div>

          {/* Enhanced Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#225F91] text-base leading-tight mb-1 truncate">
                  {item.medication.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {item.medication.description || 'No description available'}
                </p>
                
                {/* Enhanced Item Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="font-medium">₦{item.price.toLocaleString()}</span>
                  <span>•</span>
                  <span>{item.medication.strength || 'Standard strength'}</span>
                  {item.medication.manufacturer && (
                    <>
                      <span>•</span>
                      <span className="truncate">{item.medication.manufacturer}</span>
                    </>
                  )}
                </div>

                {/* Enhanced Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={cn(
                    "text-xs font-medium",
                    itemStatus.bgColor,
                    itemStatus.color,
                    itemStatus.borderColor
                  )}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {itemStatus.text}
                  </Badge>
                  
                  {item.medication.prescriptionRequired && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-medium">
                      <FileText className="h-3 w-3 mr-1" />
                      Prescription
                    </Badge>
                  )}
                  
                  {!item.medication.prescriptionRequired && (
                    <Badge className="bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20 text-xs font-medium">
                      <Package className="h-3 w-3 mr-1" />
                      OTC
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enhanced Price Display */}
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-[#225F91]">
                  ₦{calculateItemPrice(item).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  ₦{item.price.toLocaleString()} each
                </div>
              </div>
            </div>

            {/* Enhanced Status Description */}
            <div className={cn(
              "p-3 rounded-lg border mb-4",
              itemStatus.bgColor,
              itemStatus.borderColor
            )}>
              <div className="flex items-start gap-2">
                <StatusIcon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", itemStatus.color)} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#225F91] mb-1">{itemStatus.description}</p>
                  <p className="text-xs text-gray-600">
                    {itemStatus.status === 'verified' && 'Your prescription has been verified and is ready for checkout.'}
                    {itemStatus.status === 'pending' && 'Your prescription is being reviewed by our pharmacy team.'}
                    {itemStatus.status === 'rejected' && 'Your prescription was rejected. Please upload a new one.'}
                    {itemStatus.status === 'needs_prescription' && 'Please upload a prescription for this medication.'}
                    {itemStatus.status === 'ready' && 'This item is available for immediate checkout.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Enhanced Quantity Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityUpdate(item.quantity - 1)}
                    disabled={item.quantity <= 1 || isUpdating[item.id]}
                    className="h-8 w-8 p-0 hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="px-3 py-1 text-sm font-medium text-[#225F91] min-w-[2rem] text-center">
                    {isUpdating[item.id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent mx-auto"></div>
                    ) : (
                      item.quantity
                    )}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityUpdate(item.quantity + 1)}
                    disabled={isUpdating[item.id]}
                    className="h-8 w-8 p-0 hover:bg-[#1ABA7F]/20 text-[#225F91] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Enhanced Quick Actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuantityDialog(true)}
                  disabled={isUpdating[item.id]}
                  className="h-8 px-3 text-xs hover:bg-[#1ABA7F]/10 text-[#225F91] disabled:opacity-50"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>

              {/* Enhanced Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUpdating[item.id]}
                className="h-8 px-3 text-xs hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItem;