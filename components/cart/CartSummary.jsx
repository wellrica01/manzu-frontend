import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowRight, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ cart, segments, handleCheckout, canCheckout, cartType }) => {
  const totalItems = cart.pharmacies.reduce((total, pharmacy) => 
    total + pharmacy.items.reduce((sum, item) => sum + item.quantity, 0), 0
  );

  const hasReadyItems = segments?.readyForCheckout?.length > 0;
  const hasPrescriptionItems = segments?.needsPrescription?.length > 0;

  const getSummaryMessage = () => {
    switch (cartType) {
      case 'otc_only':
        return 'All items are ready for immediate checkout';
      case 'prescription_only':
        return 'Upload prescriptions to proceed with checkout';
      case 'mixed':
        return 'Some items ready, others need prescriptions';
      default:
        return 'Review your cart';
    }
  };

  const getActionButton = () => {
    if (!hasReadyItems) {
      return {
        text: 'Upload Prescriptions First',
        disabled: true,
        variant: 'outline',
        icon: FileText
      };
    }

    switch (cartType) {
      case 'otc_only':
        return {
          text: 'Proceed to Checkout',
          disabled: false,
          variant: 'default',
          icon: ArrowRight
        };
      case 'mixed':
        return {
          text: 'Checkout Ready Items',
          disabled: false,
          variant: 'default',
          icon: ArrowRight
        };
      default:
        return {
          text: 'Proceed to Checkout',
          disabled: false,
          variant: 'default',
          icon: ArrowRight
        };
    }
  };

  const actionButton = getActionButton();
  const ActionIcon = actionButton.icon;

  return (
    <Card className="bg-white/95 border border-[#1ABA7F]/20 rounded-xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-[#225F91] flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </CardTitle>
        <p className="text-sm text-gray-600">{getSummaryMessage()}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ready Items Section */}
        {hasReadyItems && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Ready for Checkout</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {segments.readyItemsCount} items
                </Badge>
              </div>
              <span className="font-bold text-green-800">₦{segments.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Prescription Items Section */}
        {hasPrescriptionItems && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Prescription Required</span>
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  {segments.prescriptionItemsCount} items
                </Badge>
              </div>
              <span className="font-bold text-orange-800">₦{segments.prescriptionPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Mixed Order Notice */}
        {cartType === 'mixed' && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Mixed Order</p>
                <p>You can checkout with ready items now. Prescription items will be available after verification.</p>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Value</span>
            <span className="text-2xl font-bold text-[#225F91]">
              ₦{(segments.totalPrice + segments.prescriptionPrice).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{totalItems} items across {cart.pharmacies.length} pharmacies</p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleCheckout}
          disabled={actionButton.disabled}
          variant={actionButton.variant}
          className={cn(
            "w-full h-12 text-base font-semibold",
            actionButton.variant === 'default' && "bg-[#225F91] hover:bg-[#1A4971] text-white",
            actionButton.variant === 'outline' && "border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
          )}
        >
          <ActionIcon className="h-4 w-4 mr-2" />
          {actionButton.text}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CartSummary;