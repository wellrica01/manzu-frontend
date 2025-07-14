import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Package,
  Shield,
  CreditCard,
  Truck,
  Star,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ cart, segments, handleCheckout, canCheckout, cartType, activeTab, tabSummary }) => {
  const hasReadyItems = segments?.readyForCheckout?.length > 0;
  const hasPrescriptionItems = segments?.needsPrescription?.length > 0;
  const hasPendingItems = segments?.pendingPrescription?.length > 0;
  const hasRejectedItems = segments?.rejectedPrescription?.length > 0;
  
  // Combined prescription items (all states that need attention)
  const hasAnyPrescriptionItems = hasPrescriptionItems || hasPendingItems || hasRejectedItems;

  // Tab-specific summary data
  const isReadyTab = activeTab === 'ready';
  const isNeedsPrescriptionTab = activeTab === 'needs_prescription';
  const isPendingTab = activeTab === 'pending';
  const isRejectedTab = activeTab === 'rejected';

  const getTabSpecificMessage = () => {
    if (isReadyTab) {
      if (hasReadyItems) {
        const hasVerifiedPrescriptions = segments.readyForCheckout.some(item => 
          item.medication.prescriptionRequired && item.prescriptionStatus === 'verified'
        );
        
        if (hasVerifiedPrescriptions) {
          return 'Your prescription has been verified and is ready for checkout';
        }
        
        return 'These medications are ready for immediate checkout';
      }
      return 'No ready medications available';
    } else if (isNeedsPrescriptionTab) {
      return 'Upload prescriptions to proceed with these medications';
    } else if (isPendingTab) {
      return 'Your prescriptions are being verified. Please wait for confirmation.';
    } else if (isRejectedTab) {
      return 'Some prescriptions were rejected. Please upload new prescriptions.';
    }
    return 'Review your cart';
  };

  const getTabSpecificActionButton = () => {
    if (isReadyTab) {
      if (!hasReadyItems) {
        return {
          text: 'No Ready Medications',
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
        className: 'bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:from-[#1ABA7F]/90 hover:to-[#225F91]/90 text-white shadow-lg hover:shadow-xl'
      };
    } else if (isNeedsPrescriptionTab) {
      return {
        text: 'Upload Prescriptions First',
        disabled: true,
        variant: 'outline',
        icon: Clock,
        className: 'border-orange-300 text-orange-500'
      };
    } else if (isPendingTab) {
      return {
        text: 'Verification in Progress',
        disabled: true,
        variant: 'outline',
        icon: Clock,
        className: 'border-blue-300 text-blue-500'
      };
    } else if (isRejectedTab) {
      return {
        text: 'Upload New Prescriptions',
        disabled: true,
        variant: 'outline',
        icon: AlertCircle,
        className: 'border-red-300 text-red-500'
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
      text: 'Checkout Ready Medications',
      disabled: false,
      variant: 'default',
      icon: ArrowRight,
      className: 'bg-gradient-to-r from-[#225F91] to-[#1ABA7F] hover:from-[#225F91]/90 hover:to-[#1ABA7F]/90 text-white shadow-lg hover:shadow-xl'
    };
  };

  const actionButton = getTabSpecificActionButton();
  const ActionIcon = actionButton.icon;

  const getTabSpecificTitle = () => {
    if (isReadyTab) {
      return 'Ready Medications Summary';
    } else if (isNeedsPrescriptionTab) {
      return 'Needs Prescription Summary';
    } else if (isPendingTab) {
      return 'Under Review Summary';
    } else if (isRejectedTab) {
      return 'Rejected Prescriptions Summary';
    }
    return 'Order Summary';
  };

  const getTabSpecificIcon = () => {
    if (isReadyTab) {
      return <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />;
    } else if (isNeedsPrescriptionTab) {
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    } else if (isPendingTab) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else if (isRejectedTab) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    return <ShoppingCart className="h-5 w-5 text-[#225F91]" />;
  };

  const getTabSpecificData = () => {
    if (isReadyTab) {
      return {
        items: segments.readyForCheckout,
        count: segments.readyItemsCount,
        price: segments.totalPrice,
        status: 'Ready',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-600'
      };
    } else if (isNeedsPrescriptionTab) {
      return {
        items: segments.needsPrescription,
        count: segments.prescriptionItemsCount,
        price: segments.prescriptionPrice,
        status: 'Pending',
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600'
      };
    } else if (isPendingTab) {
      return {
        items: segments.pendingPrescription,
        count: segments.pendingItemsCount,
        price: segments.pendingPrice,
        status: 'Under Review',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-600'
      };
    } else if (isRejectedTab) {
      return {
        items: segments.rejectedPrescription,
        count: segments.rejectedItemsCount,
        price: segments.rejectedPrice,
        status: 'Rejected',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-600'
      };
    }
    
    // Fallback
    return {
      items: [],
      count: 0,
      price: 0,
      status: 'Unknown',
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-600'
    };
  };

  const tabData = getTabSpecificData();

  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-gradient-to-r from-[#1ABA7F]/10 to-transparent pb-4">
        <CardTitle className="text-xl font-bold text-[#225F91] flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl shadow-sm">
            {getTabSpecificIcon()}
          </div>
          {getTabSpecificTitle()}
        </CardTitle>
        <p className="text-sm text-gray-600 leading-relaxed">{getTabSpecificMessage()}</p>
        
        {/* Enhanced Status Overview with Better Visual Design */}
        {isReadyTab && hasReadyItems && (
          <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-[#225F91]">Ready Medications Overview</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Medications ready:</span>
                <span className="text-green-600 font-semibold">{segments.readyItemsCount}</span>
              </div>
              {segments.readyForCheckout.some(item => item.prescriptionStatus === 'verified') && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Prescriptions verified:</span>
                  <span className="text-green-600 font-semibold">
                    {segments.readyForCheckout.filter(item => item.prescriptionStatus === 'verified').length}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Medications value:</span>
                <span className="text-green-600 font-semibold">₦{segments.totalPrice?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        )}
        
        {(isNeedsPrescriptionTab || isPendingTab || isRejectedTab) && (
          <div className={cn(
            "mt-4 p-4 rounded-xl border",
            isNeedsPrescriptionTab ? "bg-orange-50 border-orange-200" :
            isPendingTab ? "bg-blue-50 border-blue-200" :
            "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2 mb-3">
              {isNeedsPrescriptionTab ? (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              ) : isPendingTab ? (
                <Clock className="h-4 w-4 text-blue-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-semibold text-[#225F91]">
                {isNeedsPrescriptionTab ? "Needs Prescription Overview" :
                 isPendingTab ? "Under Review Overview" :
                 "Rejected Prescriptions Overview"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">
                  {isNeedsPrescriptionTab ? "Medications pending:" :
                   isPendingTab ? "Medications under review:" :
                   "Medications rejected:"}
                </span>
                <span className={cn(
                  "font-semibold",
                  isNeedsPrescriptionTab ? "text-orange-600" : 
                  isPendingTab ? "text-blue-600" : 
                  "text-red-600"
                )}>
                  {tabData.count}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Medications value:</span>
                <span className={cn(
                  "font-semibold",
                  isNeedsPrescriptionTab ? "text-orange-600" : 
                  isPendingTab ? "text-blue-600" : 
                  "text-red-600"
                )}>
                  ₦{tabData.price?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-2">
                <Info className="h-3 w-3" />
                <span className={cn(
                  isNeedsPrescriptionTab ? "text-orange-600" : 
                  isPendingTab ? "text-blue-600" : 
                  "text-red-600"
                )}>
                  {isNeedsPrescriptionTab ? "Upload prescriptions to proceed" : 
                   isPendingTab ? "Your prescriptions are being verified" : 
                   "Upload new prescriptions to proceed"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab-Specific Primary Section */}
        {isReadyTab && hasReadyItems && (
          <div className="p-6 bg-green-50 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <span className="font-bold text-lg text-[#225F91]">Ready for Checkout</span>
                  <Badge className="ml-2 text-xs font-medium bg-green-100 text-green-800 border-green-200">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            {/* Streamlined Price Display */}
            <div className="flex justify-between items-center py-3 bg-green-100 rounded-lg px-4">
              <span className="text-lg font-semibold text-[#225F91]">Total Amount</span>
              <span className="text-2xl font-bold text-[#225F91]">₦{segments.totalPrice?.toLocaleString() || '0'}</span>
            </div>
          </div>
        )}

        {/* Tab-Specific Secondary Section */}
        {(isNeedsPrescriptionTab || isPendingTab || isRejectedTab) && (
          <div className={cn(
            "p-6 rounded-2xl shadow-sm border",
            tabData.bgColor,
            tabData.borderColor
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", tabData.bgColor.replace('bg-', 'bg-').replace('-50', '-100'))}>
                  {isNeedsPrescriptionTab ? (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  ) : isPendingTab ? (
                    <Clock className="h-5 w-5 text-blue-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-lg text-[#225F91]">
                    {isNeedsPrescriptionTab ? "Needs Prescription" :
                     isPendingTab ? "Under Review" :
                     "Rejected Prescriptions"}
                  </span>
                  <Badge className={cn(
                    "ml-2 text-xs font-medium",
                    isNeedsPrescriptionTab ? "bg-orange-100 text-orange-800 border-orange-200" :
                    isPendingTab ? "bg-blue-100 text-blue-800 border-blue-200" :
                    "bg-red-100 text-red-800 border-red-200"
                  )}>
                    {tabData.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Streamlined Price Display */}
            <div className={cn(
              "flex justify-between items-center py-3 rounded-lg px-4",
              tabData.bgColor.replace('bg-', 'bg-').replace('-50', '-100')
            )}>
              <span className="text-lg font-semibold text-[#225F91]">Total Amount</span>
              <span className="text-2xl font-bold text-[#225F91]">₦{tabData.price?.toLocaleString() || '0'}</span>
            </div>
          </div>
        )}

        {/* Enhanced Action Button with Context */}
        <div className="space-y-3">
          <Button
            onClick={handleCheckout}
            disabled={actionButton.disabled}
            className={cn(
              "w-full h-14 text-lg font-semibold rounded-xl transition-all duration-300",
              actionButton.disabled 
                ? "border-gray-300 text-gray-500 bg-gray-50 cursor-not-allowed"
                : actionButton.className
            )}
          >
            <ActionIcon className="h-5 w-5 mr-2" />
            {actionButton.text}
          </Button>
          
          {/* Contextual Help Text */}
          {(isNeedsPrescriptionTab || isPendingTab || isRejectedTab) && (
            <p className={cn(
              "text-xs text-center",
              isNeedsPrescriptionTab ? "text-orange-600" : 
              isPendingTab ? "text-blue-600" : 
              "text-red-600"
            )}>
              {isNeedsPrescriptionTab ? "Upload your prescription first to proceed with checkout" :
               isPendingTab ? "Your prescriptions are being verified. Please wait for confirmation." :
               "Some prescriptions were rejected. Please upload new prescriptions to proceed."}
            </p>
          )}
        </div>

        {/* Enhanced Trust Indicators with Icons */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="h-3 w-3 text-green-600" />
              <div className="text-xs text-gray-500">Secure Payment</div>
            </div>
            <div className="text-xs text-gray-400">Multiple options</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <div className="text-xs text-gray-500">24/7 Support</div>
            </div>
            <div className="text-xs text-gray-400">Always here to help</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;