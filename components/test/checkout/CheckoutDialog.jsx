import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

const CheckoutDialog = ({
  showCheckoutDialog,
  setShowCheckoutDialog,
  bookings,
  requiresUpload,
  testOrderFile,
  confirmCheckout,
  loading,
  testOrderStatuses,
}) => {
  const itemsWithStatus = useMemo(() => {
    if (!bookings.labs || !Array.isArray(bookings.labs)) return [];
    const bookingItems = bookings.labs.flatMap(lab => lab.items || []);
    return bookingItems
      .filter(item => item && item.test && item.labTestTestId)
      .map(item => {
        const status = item.test.orderRequired
          ? (testOrderStatuses[item.labTestTestId.toString()] || 'none') === 'verified'
            ? 'Test order verified, ready to pay'
            : 'Awaiting test order verification'
          : 'No test order needed';
        return {
          ...item,
          isPayable: !item.test.orderRequired || (testOrderStatuses[item.labTestTestId.toString()] || 'none') === 'verified',
          status,
        };
      });
  }, [bookings.labs, testOrderStatuses]);

  const payableTotal = itemsWithStatus
    .filter(item => item.isPayable)
    .reduce((sum, item) => sum + item.price, 0);
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
            Confirm Your Booking
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
                          {item.test.name}
                          <span className="text-green-600">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {hasPendingItems && (
                <div>
                  <p>These items need test order verification:</p>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {itemsWithStatus
                      .filter(item => !item.isPayable)
                      .map(item => (
                        <li key={item.id}>
                          {item.test.name}
                          <span className="text-gray-500">{item.status}</span>
                        </li>
                      ))}
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    Verification takes 24-48 hours. You’ll be notified by email when ready. Track progress on the{' '}
                    <a
                      href="/test"
                      className="text-primary hover:text-primary/80 font-semibold underline"
                      aria-label="Track test order status"
                    >
                      homepage
                    </a>.
                  </p>
                </div>
              )}
              {requiresUpload && testOrderFile && (
                <p className="text-sm">
                  Your test order file (<span className="font-semibold">{testOrderFile.name}</span>) will be submitted for verification of pending items.
                </p>
              )}
            </>
          ) : (
            <p>Please review your booking as no items are available for checkout.</p>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setShowCheckoutDialog(false)}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
            aria-label="Cancel and edit booking"
          >
            Cancel and Edit Booking
          </Button>
          <Button
            onClick={confirmCheckout}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] prefers-reduced-motion:no-preference:animate-pulse transition-all duration-300"
            disabled={loading || !hasItems}
            aria-label="Confirm booking"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;