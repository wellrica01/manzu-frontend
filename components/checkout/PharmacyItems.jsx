import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

const PharmacyItems = ({ cart, calculateItemPrice }) => {
  const [expandedPharmacy, setExpandedPharmacy] = useState(null);

  const togglePharmacy = (pharmacyId) => {
    setExpandedPharmacy(expandedPharmacy === pharmacyId ? null : pharmacyId);
  };

  const groupItemsByType = (items) => {
    const otcItems = items.filter(item => !item.medication.prescriptionRequired);
    const prescriptionItems = items.filter(item => item.medication.prescriptionRequired);
    return { otcItems, prescriptionItems };
  };

  return (
    <>
      {cart.pharmacies.map((pharmacy) => {
        const { otcItems, prescriptionItems } = groupItemsByType(pharmacy.items);
        const isExpanded = expandedPharmacy === pharmacy.pharmacy.id;
        
        return (
        <div key={pharmacy.pharmacy.id} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1ABA7F]/20 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-[#1ABA7F]" />
                </div>
                <div>
          <h3 className="text-base sm:text-lg font-bold text-[#225F91]">{pharmacy.pharmacy.name}</h3>
                  <p className="text-sm text-gray-600">{pharmacy.items.length} medication{pharmacy.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePharmacy(pharmacy.pharmacy.id)}
                className="text-[#225F91] hover:text-[#1A4971] hover:bg-[#1ABA7F]/10"
                aria-label={isExpanded ? 'Collapse pharmacy medications' : 'Expand pharmacy medications'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {isExpanded && (
              <div className="space-y-4 animate-in slide-in-from-top duration-300">
                {/* OTC Medications */}
                {otcItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Over-the-Counter Medications</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {otcItems.length}
                      </Badge>
                    </div>
                    {otcItems.map((item) => (
                      <div key={item.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-gray-900 text-base font-semibold">{item.medication.displayName}</h4>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                OTC
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Quantity:</span> {item.quantity}
                              </div>
                              <div>
                                <span className="font-medium">Unit Price:</span> ₦{item.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#225F91]">
                              ₦{calculateItemPrice(item).toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600 font-medium">Ready to Pay</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prescription Medications */}
                {prescriptionItems.length > 0 && (
                  <div className="space-y-3">
              <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Prescription Medications</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {prescriptionItems.length}
                      </Badge>
                    </div>
                    {prescriptionItems.map((item) => (
                      <div key={item.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-gray-900 text-base font-semibold">{item.medication.displayName}</h4>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                Verified
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Quantity:</span> {item.quantity}
                              </div>
                              <div>
                                <span className="font-medium">Unit Price:</span> ₦{item.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#225F91]">
                              ₦{calculateItemPrice(item).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">Ready to Pay</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="bg-[#1ABA7F]/20" />
                
                {/* Pharmacy Subtotal */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-[#225F91]">Pharmacy Subtotal:</span>
                  <span className="text-lg font-bold text-[#225F91]">₦{pharmacy.subtotal.toLocaleString()}</span>
                </div>
              </div>
            )}
            </div>
        );
      })}
    </>
  );
};

export default PharmacyItems;