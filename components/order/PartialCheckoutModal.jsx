'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

const PartialCheckoutModal = ({ open, onClose, items, totalPrice, handlePartialCheckout }) => {
  const eligibleItems = items.filter((item) => !item.service.prescriptionRequired);

  const confirmCheckout = async () => {
    try {
      await handlePartialCheckout();
      onClose();
    } catch (error) {
      toast.error(`Partial checkout failed: ${error.message}`, { duration: 4000 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 rounded-2xl border-[#1ABA7F]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91]">
            Confirm Partial Checkout
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-[#225F91]">
            Checkout now for items not requiring prescriptions. Other items will be available after verification.
          </p>
          <div>
            <h3 className="text-lg font-semibold text-[#225F91]">Eligible Items:</h3>
            <ul className="list-disc pl-5 text-gray-600">
              {eligibleItems.map((item) => (
                <li key={item.id}>
                  {item.service.displayName || item.service.name} (₦{(item.price * item.quantity / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })})
                </li>
              ))}
            </ul>
          </div>
          <p className="text-lg font-bold text-[#225F91]">
            Total: ₦{(totalPrice / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            aria-label="Cancel partial checkout"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmCheckout}
            className="bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] rounded-full"
            aria-label="Confirm partial checkout"
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