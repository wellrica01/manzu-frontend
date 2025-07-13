import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowRight, CheckCircle, Clock, AlertCircle, Sparkles, Info, AlertTriangle, Package, Shield, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ cart, segments, handleCheckout, canCheckout, cartType, activeTab, tabSummary }) => {
  const totalItems = cart.pharmacies.reduce((total, pharmacy) => 
    total + pharmacy.items.reduce((sum, item) => sum + item.quantity, 0), 0
  );

  const hasReadyItems = segments?.readyForCheckout?.length > 0;
  const hasPrescriptionItems = segments?.needsPrescription?.length > 0;
  const hasPendingItems = segments?.pendingPrescription?.length > 0;
  const hasRejectedItems = segments?.rejectedPrescription?.length > 0;

  // Tab-specific summary data
  const isReadyTab = activeTab === 'ready';
  const isPrescriptionTab = activeTab === 'prescription';

  const getTabSpecificMessage = () => {
    if (isReadyTab) {
      if (hasReadyItems) {
        // Check if we have verified prescription items
        const hasVerifiedPrescriptions = segments.readyForCheckout.some(item => 
          item.medication.prescriptionRequired && item.prescriptionStatus === 'verified'
        );
        
        // Simple message for OTC-only carts
        if (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems && !hasVerifiedPrescriptions) {
          return 'Your items are ready for checkout';
        }
        
        // Message for verified prescription items
        if (hasVerifiedPrescriptions) {
          return 'Your prescription has been verified and is ready for checkout';
        }
        
        return 'These items are ready for immediate checkout';
      }
      return 'No ready items available';
    } else if (isPrescriptionTab) {
      if (hasPrescriptionItems) {
        return 'Upload prescriptions to proceed with these items';
      }
      return 'No prescription items in cart';
    }
    return 'Review your cart';
  };

  const getTabSpecificActionButton = () => {
    if (isReadyTab) {
      if (!hasReadyItems) {
        return {
          text: 'No Ready Items',
          disabled: true,
          variant: 'outline',
          icon: AlertCircle,
          className: 'border-gray-300 text-gray-500'
        };
      }
      return {
        text: 'Proceed to Checkout',
        disabled: false,
        variant: 'default',
        icon: ArrowRight,
        className: 'bg-gradient-to-r from-[#1ABA7F] to-[#1ABA7F]/90 hover:from-[#1ABA7F]/90 hover:to-[#1ABA7F] text-white shadow-lg hover:shadow-xl'
      };
    } else if (isPrescriptionTab) {
      if (!hasPrescriptionItems) {
        return {
          text: 'No Prescription Items',
          disabled: true,
          variant: 'outline',
          icon: AlertCircle,
          className: 'border-gray-300 text-gray-500'
        };
      }
      return {
        text: 'Upload Prescriptions First',
        disabled: true,
        variant: 'outline',
        icon: Clock,
        className: 'border-orange-300 text-orange-500'
      };
    }
    
    // Fallback for mixed view
    if (!hasReadyItems) {
      return {
        text: 'Upload Prescriptions First',
        disabled: true,
        variant: 'outline',
        icon: Clock,
        className: 'border-gray-300 text-gray-500'
      };
    }
        return {
          text: 'Checkout Ready Items',
          disabled: false,
          variant: 'default',
      icon: ArrowRight,
      className: 'bg-gradient-to-r from-[#225F91] to-[#225F91]/90 hover:from-[#225F91]/90 hover:to-[#225F91] text-white shadow-lg hover:shadow-xl'
    };
  };

  const actionButton = getTabSpecificActionButton();
  const ActionIcon = actionButton.icon;

  const getTabSpecificTitle = () => {
    if (isReadyTab) {
      // Simple title for OTC-only carts
      if (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
        return 'Order Summary';
      }
      return 'Ready Items Summary';
    } else if (isPrescriptionTab) {
      return 'Prescription Items Summary';
    }
    return 'Order Summary';
  };

  const getTabSpecificIcon = () => {
    if (isReadyTab) {
      // Simple icon for OTC-only carts
      if (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
        return <ShoppingCart className="h-5 w-5 text-[#225F91]" />;
      }
      return <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />;
    } else if (isPrescriptionTab) {
      return <Clock className="h-5 w-5 text-orange-600" />;
    }
    return <ShoppingCart className="h-5 w-5 text-[#225F91]" />;
  };

  const getTabSpecificColor = () => {
    if (isReadyTab) {
      // Simple color for OTC-only carts
      if (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
        return 'from-[#225F91] to-[#225F91]/90';
      }
      return 'from-[#1ABA7F] to-[#1ABA7F]/90';
    } else if (isPrescriptionTab) {
      return 'from-orange-500 to-orange-600';
    }
    return 'from-[#225F91] to-[#225F91]/90';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold text-[#225F91] flex items-center gap-3">
          <div className={cn("p-3 bg-gradient-to-br rounded-xl shadow-sm", getTabSpecificColor())}>
            {getTabSpecificIcon()}
          </div>
          {getTabSpecificTitle()}
        </CardTitle>
        <p className="text-sm text-gray-600 leading-relaxed">{getTabSpecificMessage()}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab-Specific Primary Section */}
        {isReadyTab && hasReadyItems && (
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm",
            // Simple styling for OTC-only carts
            (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) 
              ? "bg-gradient-to-r from-[#225F91]/10 to-[#225F91]/5 border-[#225F91]/20"
              : "bg-gradient-to-r from-[#1ABA7F]/10 to-[#1ABA7F]/5 border-[#1ABA7F]/20"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  // Simple styling for OTC-only carts
                  (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                    ? "bg-[#225F91]/20"
                    : "bg-[#1ABA7F]/20"
                )}>
                  {(!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) ? (
                    <ShoppingCart className="h-5 w-5 text-[#225F91]" />
                  ) : (
                <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />
                  )}
                </div>
                <div>
                  <span className={cn(
                    "font-bold text-lg",
                    // Simple styling for OTC-only carts
                    (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                      ? "text-[#225F91]"
                      : "text-[#225F91]"
                  )}>
                    {(!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) ? "Your Order" : "Ready for Checkout"}
                  </span>
                  <Badge className={cn(
                    "ml-2 text-xs font-medium",
                    // Simple styling for OTC-only carts
                    (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                      ? "bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20"
                      : "bg-[#1ABA7F]/10 text-[#1ABA7F] border-[#1ABA7F]/20"
                  )}>
                  {segments.readyItemsCount} items
                </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-3xl font-bold",
                // Simple styling for OTC-only carts
                (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                  ? "text-[#225F91]"
                  : "text-[#225F91]"
              )}>
                ₦{segments.totalPrice.toLocaleString()}
              </span>
              <p className={cn(
                "text-sm mt-1",
                // Simple styling for OTC-only carts
                (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                  ? "text-[#225F91]/70"
                  : "text-[#1ABA7F]/70"
              )}>
                {(!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) ? "Ready for checkout" : "Available for checkout"}
              </p>
            </div>
          </div>
        )}

        {isPrescriptionTab && (hasPrescriptionItems || hasPendingItems) && (
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <span className="font-bold text-lg text-orange-800">
                    {hasPendingItems ? 'Under Review' : 'Prescription Required'}
                  </span>
                  <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200 text-xs font-medium">
                    {hasPendingItems ? segments.pendingItemsCount : segments.prescriptionItemsCount} items
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-800">
                ₦{(hasPendingItems ? segments.pendingPrice : segments.prescriptionPrice).toLocaleString()}
              </span>
              <p className="text-sm text-orange-600 mt-1">
                {hasPendingItems ? 'Will be available after verification' : 'Upload prescriptions to proceed'}
              </p>
            </div>
          </div>
        )}

        {/* Mixed View - Show both sections */}
        {!isReadyTab && !isPrescriptionTab && (
          <>
            {/* Ready Items Section */}
            {hasReadyItems && (
              <div className="p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-[#1ABA7F]/5 rounded-2xl border border-[#1ABA7F]/20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1ABA7F]/20 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />
                    </div>
                    <div>
                      <span className="font-bold text-lg text-[#225F91]">Ready for Checkout</span>
                      <Badge className="ml-2 bg-[#1ABA7F]/10 text-[#1ABA7F] border-[#1ABA7F]/20 text-xs font-medium">
                        {segments.readyItemsCount} items
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#225F91]">₦{segments.totalPrice.toLocaleString()}</span>
                  <p className="text-sm text-[#1ABA7F]/70 mt-1">Available for checkout</p>
                </div>
              </div>
            )}

            {/* Prescription Required Items */}
        {hasPrescriptionItems && (
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/60 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium text-orange-800">Prescription Required</span>
                      <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200 text-xs font-medium">
                        {segments.prescriptionItemsCount} items
                      </Badge>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-orange-700">₦{segments.prescriptionPrice.toLocaleString()}</span>
                </div>
                <p className="text-sm text-orange-600 mt-2">Upload prescriptions to add to checkout</p>
              </div>
            )}
          </>
        )}

        {/* Rejected Prescription Items */}
        {hasRejectedItems && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100/50 rounded-2xl border border-red-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <span className="font-medium text-red-800">Rejected</span>
                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs font-medium">
                    {segments.rejectedItemsCount} items
                </Badge>
                </div>
              </div>
              <span className="text-lg font-bold text-red-700">₦{segments.rejectedPrice.toLocaleString()}</span>
            </div>
            <p className="text-sm text-red-600 mt-2">Please upload new prescriptions</p>
          </div>
        )}

        {/* Tab-Specific Checkout Total */}
        {isReadyTab && hasReadyItems && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-[#225F91]">
                {(!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) ? "Total" : "Checkout Total"}
              </span>
              <span className={cn(
                "text-3xl font-bold",
                // Simple styling for OTC-only carts
                (!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems)
                  ? "text-[#225F91]"
                  : "text-[#225F91]"
              )}>
                ₦{segments.totalPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {(!hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) 
                ? `${segments.readyItemsCount} items` 
                : `${segments.readyItemsCount} items ready for checkout`
              }
            </p>
          </div>
        )}

        {isPrescriptionTab && (hasPrescriptionItems || hasPendingItems) && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-[#225F91]">
                {hasPendingItems ? 'Pending Total' : 'Prescription Total'}
              </span>
              <span className="text-3xl font-bold text-orange-800">
                ₦{(hasPendingItems ? segments.pendingPrice : segments.prescriptionPrice).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {hasPendingItems 
                ? `${segments.pendingItemsCount} items under review` 
                : `${segments.prescriptionItemsCount} items require prescriptions`
              }
            </p>
              </div>
        )}

        {/* Mixed View Total */}
        {!isReadyTab && !isPrescriptionTab && hasReadyItems && (
        <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-[#225F91]">Checkout Total</span>
              <span className="text-3xl font-bold text-[#225F91]">
                ₦{segments.totalPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-500">{segments.readyItemsCount} items ready for checkout</p>
          </div>
        )}

        {/* Total Cart Value - Informational */}
        {(hasPrescriptionItems || hasPendingItems || hasRejectedItems) && !isReadyTab && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Cart Value</span>
              <span className="text-sm font-medium text-gray-700">
                ₦{(segments.totalPrice + segments.prescriptionPrice + segments.pendingPrice + segments.rejectedPrice).toLocaleString()}
            </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Including pending and prescription items</p>
          </div>
        )}

        {/* Enhanced Action Button */}
        <Button
          onClick={handleCheckout}
          disabled={actionButton.disabled}
          variant={actionButton.variant}
          className={cn(
            "w-full h-14 text-base font-semibold transition-all duration-300 rounded-xl",
            actionButton.className
          )}
        >
          <ActionIcon className="h-5 w-5 mr-3" />
          {actionButton.text}
        </Button>

        {/* Enhanced Additional Info */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-[#225F91]/5 rounded-xl">
              <Truck className="h-4 w-4 text-[#225F91]" />
              <div>
                <p className="text-sm font-medium text-[#225F91]">Free delivery</p>
                <p className="text-xs text-[#225F91]/70">On orders above ₦5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1ABA7F]/5 rounded-xl">
              <Shield className="h-4 w-4 text-[#1ABA7F]" />
              <div>
                <p className="text-sm font-medium text-[#1ABA7F]">Secure payment</p>
                <p className="text-xs text-[#1ABA7F]/70">Multiple payment options</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <Package className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">24/7 support</p>
                <p className="text-xs text-purple-600">Always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;