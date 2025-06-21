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
  // Compute item statuses with guards for undefined properties
  const itemsWithStatus = useMemo(() => {
    if (!cart.orderItems) return [];
    return cart.orderItems
      .filter(item => item && item.medication && item.pharmacyMedicationMedicationId)
      .map(item => {
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
  }, [cart.orderItems, prescriptionStatuses]);

  const payableTotal = itemsWithStatus
    .filter(item => item.isPayable)
    .reduce((sum, item) => sum + item.quantity * item.price, 0);
  const hasPendingItems = itemsWithStatus.some(item => !item.isPayable);
  const hasItems = itemsWithStatus.length > 0;

  return (
    <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
      <DialogContent
        className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
        aria-describedby="checkout-dialog-description"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CheckCircle
          className="h-10 w-10 text-green-500 mx-auto mb-4 prefers-reduced-motion:no-preference:animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
            Confirm Your Order
          </DialogTitle>
        </DialogHeader>
        <div id="checkout-dialog-description" className="py-4 text-base text-gray-600 font-medium space-y-3">
          {hasItems ? (
            <>
              {payableTotal > 0 && (
                <div>
                  <p>
                    You’re paying <span className="font-semibold">₦{payableTotal.toLocaleString()}</span> now for:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {itemsWithStatus
                      .filter(item => item.isPayable)
                      .map(item => (
                        <li key={item.id}>
                          {item.medication.displayName} (Qty: {item.quantity}) -{' '}
                          <span className="text-green-600">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {hasPendingItems && (
                <div>
                  <p>These items need prescription verification:</p>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {itemsWithStatus
                      .filter(item => !item.isPayable)
                      .map(item => (
                        <li key={item.id}>
                          {item.medication.displayName} (Qty: {item.quantity}) -{' '}
                          <span className="text-gray-500">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    Verification takes 24-48 hours. You’ll be notified by email when ready. Track progress on the{' '}
                    <a
                      href="/"
                      className="text-primary hover:text-primary/80 font-semibold underline"
                      aria-label="Track prescription status"
                    >
                      homepage
                    </a>.
                  </p>
                </div>
              )}
              {requiresUpload && prescriptionFile && (
                <p className="text-sm">
                  Your prescription file (<span className="font-semibold">{prescriptionFile.name}</span>) will be submitted for verification of pending items.
                </p>
              )}
            </>
          ) : (
            <p>Please review your cart as no items are available for checkout.</p>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setShowCheckoutDialog(false)}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
            aria-label="Cancel and edit order"
          >
            Cancel and Edit Order
          </Button>
          <Button
            onClick={confirmCheckout}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] prefers-reduced-motion:no-preference:animate-pulse transition-all duration-300"
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