'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Shield,
  Truck,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CheckoutDialog = ({ 
  show, 
  onClose, 
  onConfirm, 
  loading = false,
  segments = { readyForCheckout: [], totalPrice: 0 }
}) => {
  if (!show) return null;

  // Count unique medications, not total quantity
  const uniqueMedicationsCount = segments.readyForCheckout.length;

  // Group items by pharmacy for display
  const groupItemsByPharmacy = (items) => {
    const grouped = {};
    items.forEach(item => {
      const pharmacyId = item.pharmacy?.id || 'unknown';
      if (!grouped[pharmacyId]) {
        grouped[pharmacyId] = {
          pharmacy: item.pharmacy,
          items: []
        };
      }
      grouped[pharmacyId].items.push(item);
    });
    return Object.values(grouped);
  };

  const pharmacyGroups = groupItemsByPharmacy(segments.readyForCheckout);

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91] flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-[#1ABA7F]" />
            Confirm Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready for Payment
              </Badge>
            </div>

            {/* Medications by Pharmacy */}
            <div className="space-y-4">
              {pharmacyGroups.map((group, index) => (
                <div key={group.pharmacy?.id || index} className="border border-gray-200 rounded-lg p-4">
                  {/* Pharmacy Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-[#1ABA7F]" />
                      <h4 className="font-semibold text-gray-900">{group.pharmacy?.name || 'Unknown Pharmacy'}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-[#1ABA7F]/20 text-[#1ABA7F]">
                      {group.items.length} medication{group.items.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Medications List */}
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {item.medication.displayName}
                            </span>
                            {item.medication.prescriptionRequired && (
                              <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{item.medication.genericName}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.quantity} × ₦{item.price.toLocaleString()}
                          </div>
                          <div className="text-sm font-bold text-[#225F91]">
                            ₦{(item.quantity * item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Price Breakdown</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Medications Total:</span>
                <span className="font-medium text-gray-900">₦{segments.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">Included</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-[#225F91]">₦{segments.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Secure Payment</p>
                <p>Your payment will be processed securely through our payment partner.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-[#225F91] text-white hover:bg-[#1A4971]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₦{segments.totalPrice.toLocaleString()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;