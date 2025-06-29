'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrder } from '@/hooks/useOrder';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, ArrowLeft } from 'lucide-react';
import PrescriptionStatusCard from '../order/PrescriptionStatusCard';
import UploadPrescriptionModal from '../order/UploadPrescriptionModal';

const Checkout = () => {
  const { orders, fetchOrders, guestId } = useOrder();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPartialCheckout = searchParams.get('partial') === 'true';
  const orderId = searchParams.get('orderId');
  const [openUploadModal, setOpenUploadModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('All orders in state:', orders);


  const order = orders.find((o) => o.orderId === parseInt(orderId)) || { providers: [], totalPrice: 0, orderId: null };

  console.log('Selected order object:', order);


  useEffect(() => {
    if (orderId && !order.orderId) {
      console.log('Fetching order with ID:', orderId);
      fetchOrders({ orderId: parseInt(orderId) });
    }
  }, [orderId, order.orderId, fetchOrders]);

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderId: orderId || order.orderId, isPartial: isPartialCheckout }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout failed');
      }

      const { paymentUrl, reference, checkoutSessionId } = await response.json();

      const { default: PaystackPop } = await import('@paystack/inline-js');
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: order.email || `${guestId}@example.com`,
        amount: totalPrice * 100,
        ref: reference,
        onSuccess: (transaction) => {
          toast.success('Payment successful! Redirecting...', { duration: 4000 });
          router.push(`/confirmation?session=${checkoutSessionId}&reference=${reference}`);
        },
        onCancel: () => {
          toast.error('Payment cancelled', { duration: 4000 });
          setIsProcessing(false);
        },
      });
    } catch (error) {
      toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
      setIsProcessing(false);
    }
  };

  const handleCancelPartialCheckout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/cancel-partial-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel partial checkout');
      }
      const { cartOrderId } = await response.json();
      await fetchOrders();
      toast.success('Partial checkout cancelled, items moved to cart', { duration: 4000 });
      router.push('/order');
    } catch (error) {
      toast.error(`Failed to cancel partial checkout: ${error.message}`, { duration: 4000 });
    }
  };

  const medicationItems = order?.providers?.flatMap((provider) =>
    provider.items.filter((item) =>
      item.service.type === 'medication' &&
      (!isPartialCheckout || !item.service.prescriptionRequired || item.prescriptions?.some(p => p.status === 'verified'))
    )
  ) || [];
  const diagnosticItems = order?.providers?.flatMap((provider) =>
    provider.items.filter((item) =>
      (item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package') &&
      (!isPartialCheckout || !item.service.prescriptionRequired || item.prescriptions?.some(p => p.status === 'verified'))
    )
  ) || [];
  const totalPrice = isPartialCheckout
    ? order?.providers?.reduce(
        (sum, provider) =>
          sum +
          provider.items
            .filter((item) => !item.service.prescriptionRequired || item.prescriptions?.some(p => p.status === 'verified'))
            .reduce((sub, item) => sub + (item.quantity || 0) * (item.price || 0), 0),
        0
      ) || 0
    : order?.totalPrice || 0;

  console.log('Checkout.jsx state:', { orderId, isPartialCheckout, medicationItems, diagnosticItems, totalPrice });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] text-center">
            {isPartialCheckout ? 'Partial Checkout' : 'Checkout'}
          </h1>
          {isPartialCheckout && (
            <Button
              variant="outline"
              onClick={handleCancelPartialCheckout}
              className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
              aria-label="Cancel partial checkout"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel Partial Checkout
            </Button>
          )}
        </div>
        {order?.providers?.length && (medicationItems.length > 0 || diagnosticItems.length > 0) ? (
          <div className="space-y-8">
            {medicationItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#225F91] mb-4">Medications</h2>
                <div className="space-y-4">
                  {medicationItems.map((item) => (
                    <PrescriptionStatusCard
                      key={item.id}
                      item={item}
                      onReupload={(itemId, type) => setOpenUploadModal({ type, itemId })}
                    />
                  ))}
                </div>
              </div>
            )}
            {diagnosticItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#225F91] mb-4">Lab/Diagnostic Items</h2>
                <div className="space-y-4">
                  {diagnosticItems.map((item) => (
                    <PrescriptionStatusCard
                      key={item.id}
                      item={item}
                      onReupload={(itemId, type) => setOpenUploadModal({ type, itemId })}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="text-right">
              <p className="text-xl font-bold text-[#225F91] mb-4">
                Total: ₦{(totalPrice / 100 || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <Button
                className="h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)]"
                onClick={handleCheckout}
                disabled={isProcessing || totalPrice === 0 || (medicationItems.length === 0 && diagnosticItems.length === 0)}
                aria-label="Complete checkout"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Complete Checkout'}
              </Button>
            </div>
            <UploadPrescriptionModal
              open={!!openUploadModal}
              onClose={() => setOpenUploadModal(null)}
              type={openUploadModal?.type}
              items={openUploadModal?.type === 'medication' ? medicationItems : diagnosticItems}
              orderId={order.orderId}
              fetchOrders={fetchOrders}
            />
          </div>
        ) : (
          <div className="text-center text-gray-600">
            {isPartialCheckout
              ? 'No ready items available for checkout.'
              : 'No items in order.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;