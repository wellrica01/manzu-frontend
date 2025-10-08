'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  CheckCircle, 
  Loader2,
  X,
  Shield,
  Store,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CheckoutDialog = ({ 
  show, 
  onClose, 
  onConfirm, 
  loading = false,
  segments = { readyForCheckout: [], totalPrice: 0 }
}) => {
  if (!show) return null;

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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-3xl bg-white shadow-2xl mx-auto">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 rounded-3xl" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#225F91]/10 to-transparent rounded-tr-full" />

        <div className="relative z-10 px-5 py-8">
          {/* Header with icon animation */}
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-2xl blur-xl opacity-30 animate-pulse" />
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg sm:text-2xl lg:text-3xl font-black text-[#225F91] tracking-tight mb-2">
                  Confirm Your Order
                </DialogTitle>
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready for Payment
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Medications by Pharmacy */}
            <div className="space-y-3 sm:space-y-4">
              {pharmacyGroups.map((group, index) => (
                <div 
                  key={group.pharmacy?.id || index} 
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 p-3 sm:p-5 hover:border-[#1ABA7F]/30 transition-all duration-300 hover:shadow-lg"
                  role="region"
                  aria-label={`Medications from ${group.pharmacy?.name || 'Unknown Pharmacy'}`}
                >
                  {/* Pharmacy Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1ABA7F]/20 to-[#1ABA7F]/10 flex items-center justify-center">
                        <Store className="h-4 w-4 sm:h-5 sm:w-5 text-[#1ABA7F]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base sm:text-lg">
                          {group.pharmacy?.name || 'Unknown Pharmacy'}
                        </h4>
                        <p className="text-sm text-gray-500">{group.items.length} medication{group.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="space-y-2 sm:space-y-3">
                    {group.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/30 transition-colors duration-200"
                        role="listitem"
                        aria-label={`Medication: ${item.medication.displayName}`}
                      >
                        <div className="flex-1 min-w-0 pr-3 sm:pr-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">
                              {item.medication.displayName}
                            </span>
                          </div>
                          {item.medication.ingredients?.length > 0 && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {item.medication.ingredients
                                .map(ing => `${ing.activeSubstance} ${ing.strengthValue}${ing.strengthUnit}`)
                                .join(" + ")}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                          <div className="text-sm text-gray-600">
                            {item.quantity} × ₦{item.price.toLocaleString()}
                          </div>
                          <div className="text-base font-bold text-[#225F91]">
                            ₦{(item.quantity * item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

            {/* Price Breakdown Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#225F91]/5 to-[#1ABA7F]/5 p-4 sm:p-5 border-2 border-[#1ABA7F]/20">
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 text-[#1ABA7F]" />
                  Price Breakdown
                </h4>
                
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medications Total:</span>
                    <span className="font-semibold text-gray-900">₦{segments.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                <div className="flex justify-between items-center py-2">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
                    ₦{segments.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="text-sm text-green-800">
                  <p className="font-bold mb-1">Secure Payment</p>
                  <p>Your payment will be processed securely through our payment partner.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={onConfirm}
                disabled={loading}
                className="group w-full sm:flex-1 h-12 px-4 sm:px-6 text-base font-bold rounded-xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                aria-label={`Pay ₦${segments.totalPrice.toLocaleString()}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                      Pay ₦{segments.totalPrice.toLocaleString()}
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto h-12 px-4 sm:px-6 text-sm sm:text-base font-bold rounded-xl border-2 border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-105"
                disabled={loading}
                aria-label="Cancel order confirmation"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;