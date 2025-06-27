'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOrder } from '@/hooks/useOrder';
import { Button } from '@/components/ui/button';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyOrder from './EmptyOrder';
import RemoveItemDialog from './RemoveItemDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import ProviderOrderCard from './ProviderOrderCard';
import OrderSummary from './OrderSummary';
import OrderDialog from '../search/OrderDialog';
import UploadPrescriptionModal from './UploadPrescriptionModal';
import PartialCheckoutModal from './PartialCheckoutModal';
import OrderStatusBanner from './OrderStatusBanner';

export default function Order() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItemDetails, setLastAddedItemDetails] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(null); // { type: 'medication' | 'diagnostic', itemId?: string }
  const [openPartialCheckoutModal, setOpenPartialCheckoutModal] = useState(false);
  const router = useRouter();
  const { order, fetchOrder, updateOrderItem, guestId } = useOrder();

  useEffect(() => {
    async function loadOrder() {
      try {
        await fetchOrder();
      } catch (err) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setIsFetched(true);
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [fetchOrder]);

  const handleQuantityChange = async (itemId, newQuantity, displayName) => {
    if (newQuantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    try {
      setIsUpdating((prev) => ({ ...prev, [itemId]: true }));
      await updateOrderItem({
        itemId,
        quantity: newQuantity,
        type: order.providers
          .flatMap((p) => p.items)
          .find((item) => item.id === itemId)?.service.type,
      });
      await fetchOrder();
      toast.success(`Quantity updated for ${displayName}`);
    } catch (error) {
      toast.error(`Failed to update quantity for ${displayName}: ${error.message}`);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async () => {
    if (!removeItem?.id) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    setIsUpdating((prev) => ({ ...prev, [removeItem.id]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/remove/${removeItem.id}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      await fetchOrder();
      setRemoveItem(null);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_order', { orderItemId: removeItem.id });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating((prev) => ({ ...prev, [removeItem.id]: false }));
    }
  };

  const handleCheckout = () => {
    const hasDiagnosticsWithoutDetails = order.providers.some((provider) =>
      provider.items.some(
        (item) => item.service.type === 'diagnostic' && (!item.timeSlotStart || !item.fulfillmentMethod)
      )
    );
    const hasMedicationsWithoutDelivery = order.providers.some((provider) =>
      provider.items.some(
        (item) => item.service.type === 'medication' && !item.fulfillmentMethod
      )
    );
    const hasUnverifiedPrescriptions = order.providers.some((provider) =>
      provider.items.some(
        (item) => item.service.prescriptionRequired && (!item.prescriptions?.length || !item.prescriptions.some(p => p.status === 'verified'))
      )
    );
    if (hasDiagnosticsWithoutDetails) {
      toast.error('Please select a time slot and fulfillment type for all diagnostic services before proceeding to checkout', { duration: 4000 });
      return;
    }
    if (hasMedicationsWithoutDelivery) {
      toast.error('Please select a delivery method for all medication items before proceeding to checkout', { duration: 4000 });
      return;
    }
    if (hasUnverifiedPrescriptions) {
      const unverifiedItems = order.providers
        .flatMap((provider) => provider.items)
        .filter((item) => item.service.prescriptionRequired && (!item.prescriptions?.length || !item.prescriptions.some(p => p.status === 'verified')))
        .map((item) => item.service.displayName || item.service.name);
      toast.error(`Please upload or wait for verification of prescriptions for: ${unverifiedItems.join(', ')}`, { duration: 4000 });
      return;
    }
    router.push('/med/checkout');
  };

  const handlePartialCheckout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/order/partial-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process partial checkout');
      }
      await fetchOrder();
      toast.success('OTC and routine labs sent to checkout', { duration: 4000 });
      router.push('/med/checkout?partial=true');
    } catch (error) {
      toast.error(`Partial checkout failed: ${error.message}`, { duration: 4000 });
    }
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const medicationProviders = order?.providers?.map((provider) => ({
    ...provider,
    items: provider.items.filter((item) => item.service.type === 'medication'),
  })).filter((provider) => provider.items.length > 0) || [];

  const diagnosticProviders = order?.providers?.map((provider) => ({
    ...provider,
    items: provider.items.filter((item) => item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package'),
  })).filter((provider) => provider.items.length > 0) || [];

  const getStatusSummary = (items) => {
    const nonPrescription = items.filter((item) => !item.service.prescriptionRequired).length;
    const verified = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified')
    ).length;
    const pending = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending')
    ).length;
    const rejected = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected')
    ).length;
    const parts = [];
    if (nonPrescription) parts.push(`${nonPrescription} OTC`);
    if (verified) parts.push(`${verified} verified`);
    if (pending) parts.push(`${pending} pending`);
    if (rejected) parts.push(`${rejected} rejected`);
    return parts.length ? `Status: ${parts.join(', ')}` : 'No items';
  };

  const hasNonPrescriptionItems = order?.providers?.some((provider) =>
    provider.items.some((item) => !item.service.prescriptionRequired)
  );

  const allPrescriptionsVerified = !order?.providers?.some((provider) =>
    provider.items.some(
      (item) => item.service.prescriptionRequired && (!item.prescriptions?.length || !item.prescriptions.some(p => p.status === 'verified'))
    )
  );

  const hasPendingPrescriptions = order?.providers?.some((provider) =>
    provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending'))
  );
  const hasRejectedPrescriptions = order?.providers?.some((provider) =>
    provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected'))
  );
  const hasVerifiedPrescriptions = order?.providers?.some((provider) =>
    provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified'))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Your Order
        </h1>
        <ErrorMessage error={error} />
        <OrderStatusBanner
          hasPending={hasPendingPrescriptions}
          hasRejected={hasRejectedPrescriptions}
          hasVerified={hasVerifiedPrescriptions}
          onReupload={() => setOpenUploadModal({ type: 'medication' })}
        />
        <OrderDialog
          openOrderDialog={openOrderDialog}
          setOpenOrderDialog={setOpenOrderDialog}
          lastAddedItem={lastAddedItem}
          serviceType={lastAddedItemDetails?.serviceType}
          lastAddedItemDetails={lastAddedItemDetails}
          isEditMode={isEditMode}
          fetchOrder={fetchOrder}
        />
        <UploadPrescriptionModal
          open={!!openUploadModal}
          onClose={() => setOpenUploadModal(null)}
          type={openUploadModal?.type}
          items={openUploadModal?.type === 'medication'
            ? medicationProviders.flatMap((provider) => provider.items)
            : diagnosticProviders.flatMap((provider) => provider.items)}
          orderId={order.orderId}
          fetchOrder={fetchOrder}
        />
        <PartialCheckoutModal
          open={openPartialCheckoutModal}
          onClose={() => setOpenPartialCheckoutModal(false)}
          items={order.providers?.flatMap((provider) => provider.items) || []}
          totalPrice={order.providers?.reduce((sum, provider) =>
            sum + provider.items
              .filter((item) => !item.service.prescriptionRequired)
              .reduce((sub, item) => sub + item.quantity * item.price, 0), 0) || 0}
          handlePartialCheckout={handlePartialCheckout}
        />
        {isLoading ? (
          <div className="text-center text-gray-600">Loading order...</div>
        ) : !isFetched ? null : !order?.providers?.length ? (
          <EmptyOrder />
        ) : (
          <div className="space-y-8">
            <RemoveItemDialog
              removeItem={removeItem}
              setRemoveItem={setRemoveItem}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
            />
            <QuantityUpdateDialog
              quantityUpdate={quantityUpdate}
              setQuantityUpdate={setQuantityUpdate}
              handleCheckout={handleCheckout}
            />
            {medicationProviders.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#225F91]">Medications</h2>
                  {medicationProviders.some((provider) =>
                    provider.items.some((item) => item.service.prescriptionRequired)
                  ) && (
                    <Button
                      className="h-10 px-6 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                      onClick={() => setOpenUploadModal({ type: 'medication' })}
                      aria-label="Upload prescription for all medications"
                    >
                      Upload Prescription for All Medications
                    </Button>
                  )}
                </div>
                <p className="text-lg font-semibold text-[#225F91] mb-4">
                  {getStatusSummary(medicationProviders.flatMap((provider) => provider.items))}
                </p>
                {medicationProviders.map((provider) => (
                  <ProviderOrderCard
                    key={provider.provider.id}
                    provider={provider}
                    type="medication"
                    handleQuantityChange={handleQuantityChange}
                    setRemoveItem={setRemoveItem}
                    isUpdating={isUpdating}
                    calculateItemPrice={calculateItemPrice}
                    setOpenOrderDialog={setOpenOrderDialog}
                    setLastAddedItemDetails={setLastAddedItemDetails}
                    setIsEditMode={setIsEditMode}
                    setOpenUploadModal={setOpenUploadModal}
                    fetchOrder={fetchOrder}
                  />
                ))}
              </div>
            )}
            {diagnosticProviders.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#225F91]">Lab/Diagnostic Items</h2>
                  {diagnosticProviders.some((provider) =>
                    provider.items.some((item) => item.service.prescriptionRequired)
                  ) && (
                    <Button
                      className="h-10 px-6 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                      onClick={() => setOpenUploadModal({ type: 'diagnostic' })}
                      aria-label="Upload lab request for all diagnostics"
                    >
                      Upload Lab Request for All Diagnostics
                    </Button>
                  )}
                </div>
                <p className="text-lg font-semibold text-[#225F91] mb-4">
                  {getStatusSummary(diagnosticProviders.flatMap((provider) => provider.items))}
                </p>
                {diagnosticProviders.map((provider) => (
                  <ProviderOrderCard
                    key={provider.provider.id}
                    provider={provider}
                    type="diagnostic"
                    handleQuantityChange={handleQuantityChange}
                    setRemoveItem={setRemoveItem}
                    isUpdating={isUpdating}
                    calculateItemPrice={calculateItemPrice}
                    setOpenOrderDialog={setOpenOrderDialog}
                    setLastAddedItemDetails={setLastAddedItemDetails}
                    setIsEditMode={setIsEditMode}
                    setOpenUploadModal={setOpenUploadModal}
                    fetchOrder={fetchOrder}
                  />
                ))}
              </div>
            )}
            <OrderSummary
              order={order}
              handleCheckout={handleCheckout}
              handlePartialCheckout={() => setOpenPartialCheckoutModal(true)}
              hasNonPrescriptionItems={hasNonPrescriptionItems}
              allPrescriptionsVerified={allPrescriptionsVerified}
            />
          </div>
        )}
      </div>
    </div>
  );
}