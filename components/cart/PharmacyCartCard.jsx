import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Plus, 
  Minus,
  Trash2,
  Edit3,
  Star,
  Truck,
  Shield
} from 'lucide-react';
import CartItem from './CartItem';
import { cn } from '@/lib/utils';

const PharmacyCartCard = ({ 
  pharmacy, 
  handleQuantityChange, 
  setRemoveItem, 
  isUpdating, 
  calculateItemPrice,
  segment = 'ready'
}) => {
  const [expanded, setExpanded] = useState(true);

  const getPharmacyStatus = () => {
    const hasPrescriptionItems = pharmacy.items.some(item => item.medication?.prescriptionRequired);
    const hasVerifiedItems = pharmacy.items.some(item => 
      item.medication?.prescriptionRequired && item.prescriptionStatus === 'verified'
    );
    const hasPendingItems = pharmacy.items.some(item => 
      item.medication?.prescriptionRequired && item.prescriptionStatus === 'pending'
    );

    if (hasVerifiedItems) {
      return {
        status: 'verified',
        icon: CheckCircle,
        color: 'text-[#1ABA7F]',
        bgColor: 'bg-[#1ABA7F]/10',
        borderColor: 'border-[#1ABA7F]/20',
        text: 'Prescription Verified',
        description: 'Ready for checkout'
      };
    } else if (hasPendingItems) {
      return {
        status: 'pending',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        text: 'Under Review',
        description: 'Prescription being verified'
      };
    } else if (hasPrescriptionItems) {
      return {
        status: 'needs_prescription',
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        text: 'Prescription Required',
        description: 'Upload prescription to proceed'
      };
    } else {
      return {
        status: 'ready',
        icon: Package,
        color: 'text-[#225F91]',
        bgColor: 'bg-[#225F91]/10',
        borderColor: 'border-[#225F91]/20',
        text: 'Ready for Checkout',
        description: 'Available for immediate checkout'
      };
    }
  };

  const pharmacyStatus = getPharmacyStatus();
  const StatusIcon = pharmacyStatus.icon;

  const calculatePharmacyTotal = () => {
    return pharmacy.items.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const getPharmacyType = () => {
    const hasOTC = pharmacy.items.some(item => !item.medication?.prescriptionRequired);
    const hasPrescription = pharmacy.items.some(item => item.medication?.prescriptionRequired);
    
    if (hasOTC && hasPrescription) return 'mixed';
    if (hasOTC && !hasPrescription) return 'otc_only';
    if (hasPrescription && !hasOTC) return 'prescription_only';
    return 'unknown';
  };

  const pharmacyType = getPharmacyType();

  return (
    <Card className={cn(
      "bg-white/95 backdrop-blur-sm border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl",
      pharmacyStatus.borderColor
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-xl shadow-sm",
                pharmacyStatus.bgColor
              )}>
                <StatusIcon className={cn("h-5 w-5", pharmacyStatus.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-[#225F91] truncate">
                  {pharmacy.pharmacy.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(
                    "text-xs font-medium",
                    pharmacyStatus.bgColor,
                    pharmacyStatus.color,
                    pharmacyStatus.borderColor
                  )}>
                    {pharmacyStatus.text}
                  </Badge>
                  {pharmacyType === 'mixed' && (
                    <Badge className="bg-[#1ABA7F]/10 text-[#1ABA7F] border-[#1ABA7F]/20 text-xs font-medium">
                      Mixed
                    </Badge>
                  )}
                  {pharmacyType === 'otc_only' && (
                    <Badge className="bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20 text-xs font-medium">
                      OTC Only
                    </Badge>
                  )}
                  {pharmacyType === 'prescription_only' && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-medium">
                      Prescription
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#1ABA7F]" />
                <span className="truncate">{pharmacy.pharmacy.address}</span>
              </div>
              {pharmacy.pharmacy.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[#1ABA7F]" />
                  <span>{pharmacy.pharmacy.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-[#1ABA7F]/10 text-[#225F91]"
            >
              <div className={cn(
                "w-5 h-5 border-2 border-current rounded transition-transform duration-200",
                expanded ? "rotate-45" : ""
              )}>
                <div className="w-3 h-0.5 bg-current absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                <div className="w-0.5 h-3 bg-current absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </Button>
          </div>
        </div>

        {/* Enhanced Status Description */}
        <div className={cn(
          "p-3 rounded-xl border",
          pharmacyStatus.bgColor,
          pharmacyStatus.borderColor
        )}>
          <div className="flex items-start gap-3">
            <StatusIcon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", pharmacyStatus.color)} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#225F91] mb-1">{pharmacyStatus.description}</p>
              <p className="text-xs text-gray-600">
                {pharmacyStatus.status === 'verified' && 'Your prescription has been verified and is ready for checkout.'}
                {pharmacyStatus.status === 'pending' && 'Your prescription is being reviewed by our pharmacy team.'}
                {pharmacyStatus.status === 'needs_prescription' && 'Please upload a prescription for these items to proceed.'}
                {pharmacyStatus.status === 'ready' && 'These items are available for immediate checkout.'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {pharmacy.items.map((item, index) => (
              <div key={item.id}>
                <CartItem
                  item={item}
                  handleQuantityChange={handleQuantityChange}
                  setRemoveItem={setRemoveItem}
                  isUpdating={isUpdating}
                  calculateItemPrice={calculateItemPrice}
                  segment={segment}
                />
                {index < pharmacy.items.length - 1 && (
                  <Separator className="my-4 bg-gray-100" />
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Pharmacy Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#225F91]/5 to-[#1ABA7F]/5 rounded-xl border border-[#1ABA7F]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1ABA7F]/20 rounded-xl">
                  <Package className="h-5 w-5 text-[#1ABA7F]" />
                </div>
                <div>
                  <span className="font-semibold text-[#225F91]">Pharmacy Total</span>
                  <p className="text-sm text-gray-600">{pharmacy.items.length} items</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#225F91]">
                  ₦{calculatePharmacyTotal().toLocaleString()}
                </span>
                <p className="text-sm text-[#1ABA7F]/70">
                  {pharmacyStatus.status === 'verified' && 'Ready for checkout'}
                  {pharmacyStatus.status === 'pending' && 'Pending verification'}
                  {pharmacyStatus.status === 'needs_prescription' && 'Requires prescription'}
                  {pharmacyStatus.status === 'ready' && 'Available now'}
                </p>
              </div>
            </div>

            {/* Enhanced Pharmacy Features */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 p-2 bg-[#225F91]/5 rounded-lg">
                <Truck className="h-4 w-4 text-[#225F91]" />
                <span className="text-xs font-medium text-[#225F91]">Free delivery</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#1ABA7F]/5 rounded-lg">
                <Shield className="h-4 w-4 text-[#1ABA7F]" />
                <span className="text-xs font-medium text-[#1ABA7F]">Verified pharmacy</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PharmacyCartCard;