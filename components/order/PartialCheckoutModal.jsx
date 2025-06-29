'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PartialCheckoutModal = ({ open, onClose, items, totalPrice, handlePartialCheckout, orderLabel }) => {
  const router = useRouter();
  const eligibleItems = items.filter(
    (item) => {
      const isEligible = item?.service?.prescriptionRequired === false || 
        (item?.service?.prescriptionRequired && item?.prescriptions?.some(p => p?.status === 'verified'));
      if (!isEligible) {
        console.log(`Item ${item?.id} excluded:`, {
          prescriptionRequired: item?.service?.prescriptionRequired,
          prescriptions: item?.prescriptions
        });
      }
      return isEligible;
    }
  );

  console.log('PartialCheckoutModal:', { eligibleItems, totalPrice, orderLabel });

  const confirmCheckout = async () => {
    try {
      const response = await handlePartialCheckout();
      onClose();
      router.push(`/checkout?partial=true&orderId=${response.newOrderId}`);
    } catch (error) {
      toast.error(`Partial checkout failed: ${error.message}`, { duration: 4000 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 rounded-2xl border-[#1ABA7F]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91]">
            Confirm Partial Checkout for {orderLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-[#225F91]">
            Checkout now for items in {orderLabel} that are either non-prescription or have verified prescriptions. Other items will be available after verification.
          </p>
          <div>
            <h3 className="text-lg font-semibold text-[#225F91]">Eligible Items:</h3>
            {eligibleItems.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600">
                {eligibleItems.map((item) => (
                  <li key={item.id}>
                    {item.service?.displayName || item.service?.name || 'Unknown Item'} (₦{((item.price * item.quantity) / 100 || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No eligible items for partial checkout in this order.</p>
            )}
          </div>
          <p className="text-lg font-bold text-[#225F91]">
            Total: ₦{(totalPrice / 100 || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            aria-label={`Cancel partial checkout for ${orderLabel}`}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmCheckout}
            className="bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] rounded-full"
            aria-label={`Confirm partial checkout for ${orderLabel}`}
            disabled={eligibleItems.length === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartialCheckoutModal;