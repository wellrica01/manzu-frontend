import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

const CheckoutDialog = ({
  showCheckoutDialog,
  setShowCheckoutDialog,
  cart,
  requiresUpload,
  prescriptionFile,
  confirmCheckout,
  loading,
  prescriptionStatuses,
}) => {
  const itemsWithStatus = useMemo(() => {
    if (!cart.pharmacies || !Array.isArray(cart.pharmacies)) return [];
    const orderItems = cart.pharmacies.flatMap((pharmacy) => pharmacy.items || []);
    return orderItems
      .filter((item) => item && item.medication && item.pharmacyMedicationMedicationId)
      .map((item) => {
        const status = item.medication.prescriptionRequired
          ? (prescriptionStatuses[item.pharmacyMedicationMedicationId.toString()] || 'none') === 'verified'
            ? 'Prescription verified, ready to pay'
            : 'Awaiting prescription verification'
          : 'No prescription needed';
        return {
          ...item,
          isPayable: !item.medication.prescriptionRequired || (prescriptionStatuses[item.pharmacyMedicationMedicationId.toString()] || 'none') === 'verified',
          status,
        };
      });
  }, [cart.pharmacies, prescriptionStatuses]);

  const payableTotal = itemsWithStatus
    .filter((item) => item.isPayable)
    .reduce((sum, item) => sum + item.quantity * item.price, 0);
  const hasPendingItems = itemsWithStatus.some((item) => !item.isPayable);
  const hasItems = itemsWithStatus.length > 0;

  return (
    <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
      <DialogContent
        className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top fade-in-20 duration-300"
        aria-describedby="checkout-dialog-description"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <CheckCircle
          className="h-10 w-10 text-[#1ABA7F] mx-auto mb-4 prefers-reduced-motion:no-preference:animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91] text-center tracking-tight">
            Confirm Your Order
          </DialogTitle>
        </DialogHeader>
        <div id="checkout-dialog-description" className="py-4 text-base text-gray-600 font-medium space-y-4">
          {hasItems ? (
            <>
              {payableTotal > 0 && (
                <div>
                  <p>
                    You’re paying <span className="font-semibold text-gray-900">₦{payableTotal.toLocaleString()}</span> now for:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-2">
                    {itemsWithStatus
                      .filter((item) => item.isPayable)
                      .map((item) => (
                        <li key={item.id} className="text-gray-600">
                          {item.medication.displayName} (Qty: {item.quantity}) -{' '}
                          <span className="text-[#1ABA7F]">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {hasPendingItems && (
                <div>
                  <p>These items need prescription verification:</p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-2">
                    {itemsWithStatus
                      .filter((item) => !item.isPayable)
                      .map((item) => (
                        <li key={item.id} className="text-gray-600">
                          {item.medication.displayName} (Qty: {item.quantity}) -{' '}
                          <span className="text-gray-500">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    Verification takes 24-48 hours. You’ll be notified by email when ready. Track progress on the{' '}
                    <a
                      href="/med"
                      className="text-[#225F91] hover:text-[#1A4971] font-semibold underline transition-colors duration-300"
                      aria-label="Track prescription status"
                    >
                      homepage
                    </a>.
                  </p>
                </div>
              )}
              {requiresUpload && prescriptionFile && (
                <p className="text-sm text-gray-600">
                  Your prescription file (<span className="font-semibold text-gray-900">{prescriptionFile.name}</span>) will be submitted for verification of pending items.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-600">Please review your cart as no items are available for checkout.</p>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setShowCheckoutDialog(false)}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.2)] transition-all duration-300"
            aria-label="Cancel and edit order"
          >
            Cancel and Edit Order
          </Button>
          <Button
            onClick={confirmCheckout}
            className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
            disabled={loading || !hasItems}
            aria-label="Confirm order"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;