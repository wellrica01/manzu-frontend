import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatOperatingHours, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';

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
  Info,
  HospitalIcon
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
      item.medication?.prescriptionRequired && item.prescriptionStatus === 'VERIFIED'
    );
    const hasPendingItems = pharmacy.items.some(item => 
      item.medication?.prescriptionRequired && item.prescriptionStatus === 'PENDING'
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
      "overflow-hidden bg-white/95 border border-[#1ABA7F]/20 rounded-xl p-0 shadow-lg sm:p-6",
      pharmacyStatus.borderColor
    )}>
    {/* 🔹 Cover Photo */}
    {pharmacy.pharmacy.logoUrl && (
      <div className="relative w-full h-28 overflow-hidden rounded-t-xl">
        <img
          src={pharmacy.pharmacy.logoUrl}
          alt={`${pharmacy.pharmacy.name} cover`}
          className="w-full h-full object-cover"
        />
        {/* Optional: gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    )}
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />
      <CardHeader className="bg-gradient-to-r from-[#1ABA7F]/10 to-transparent pb-4">
        <div className="flex flex-wrap items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-xl shadow-sm",
                pharmacyStatus.bgColor
              )}>
                <HospitalIcon className={cn("h-5 w-5", pharmacyStatus.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle
                  className="text-lg font-bold text-[#225F91] break-words whitespace-normal max-w-[220px] sm:max-w-[320px] truncate"
                  title={pharmacy.pharmacy.name}
                >
                  {pharmacy.pharmacy.name}
                </CardTitle>
              </div>
            </div>
            
            {/* Enhanced Pharmacy Information */}
            <div className="space-y-2">
              {/* Basic Contact Info */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-[#1ABA7F]" />
                  <span className="truncate">{pharmacy.pharmacy.address}</span>
              </div>

              {/* Enhanced Pharmacy Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {pharmacy.pharmacy.operatingHours && (() => {
                  const formattedHours = formatOperatingHours(pharmacy.pharmacy.operatingHours);
                  if (!formattedHours) return null;
                  return (
                    <div className="flex items-center mb-2 gap-1">
                      <span className="text-gray-500 text-xs font-semibold min-w-[60px]">Opening Hours:</span>
                      <span className={cn('text-xs font-medium', getOperatingHoursTextColor(pharmacy.pharmacy.operatingHours))}>
                        {formattedHours.text}
                      </span>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="rounded-lg border border-[#1ABA7F]/30 bg-white shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="p-2 hover:bg-[#1ABA7F]/10 text-[#225F91]"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <Minus className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pb-6 px-3">
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