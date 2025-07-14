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
  Shield,
  Building,
  Award,
  Calendar,
  Info
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
        description: 'All medications ready for checkout'
      };
    } else if (hasPendingItems) {
      return {
        status: 'pending',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        text: 'Under Review',
        description: 'Prescriptions being verified by pharmacy team'
      };
    } else if (hasPrescriptionItems) {
      return {
        status: 'needs_prescription',
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        text: 'Prescription Required',
        description: 'Upload prescriptions to proceed with checkout'
      };
    } else {
      return {
        status: 'ready',
        icon: Package,
        color: 'text-[#225F91]',
        bgColor: 'bg-[#225F91]/10',
        borderColor: 'border-[#225F91]/20',
        text: 'Ready for Checkout',
        description: 'All medications available for immediate checkout'
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
      "relative bg-white/95 backdrop-blur-sm border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden",
      pharmacyStatus.borderColor
    )}>
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-gradient-to-r from-[#1ABA7F]/10 to-transparent pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-xl shadow-sm",
                pharmacyStatus.bgColor
              )}>
                <Building className={cn("h-5 w-5", pharmacyStatus.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-[#225F91] truncate">
                  {pharmacy.pharmacy.name}
                </CardTitle>
              </div>
            </div>
            
            {/* Enhanced Pharmacy Information */}
            <div className="space-y-2">
              {/* Basic Contact Info */}
              <div className="flex items-center gap-4 text-sm text-gray-700">
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

              {/* Enhanced Pharmacy Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {/* License Number */}
                {pharmacy.pharmacy.licenseNumber && (
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-[#225F91]" />
                    <span>License: {pharmacy.pharmacy.licenseNumber}</span>
                  </div>
                )}

                {/* Operating Hours */}
                {pharmacy.pharmacy.operatingHours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#225F91]" />
                    <span>{pharmacy.pharmacy.operatingHours}</span>
                  </div>
                )}

                {/* Verification Status */}
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-[#1ABA7F]" />
                  <span className={cn(
                    pharmacy.pharmacy.status === 'verified' ? 'text-green-600' : 
                    pharmacy.pharmacy.status === 'pending' ? 'text-orange-600' : 'text-gray-500'
                  )}>
                    {pharmacy.pharmacy.status === 'verified' ? 'Verified Pharmacy' :
                     pharmacy.pharmacy.status === 'pending' ? 'Pending Verification' : 'Unverified'}
                  </span>
                </div>
              </div>
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

        </CardContent>
      )}
    </Card>
  );
};

export default PharmacyCartCard;