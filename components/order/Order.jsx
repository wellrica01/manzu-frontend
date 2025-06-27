'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOrder } from '@/hooks/useOrder';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyOrder from './EmptyOrder';
import RemoveItemDialog from './RemoveItemDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import ProviderOrderCard from './ProviderOrderCard';
import OrderSummary from './OrderSummary';
import OrderDialog from '../search/OrderDialog';

export default function Order() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItemDetails, setLastAddedItemDetails] = useState(null);
  const router = useRouter();
  const { order, fetchOrder, guestId } = useOrder();

  useEffect(() => {
    async function loadOrder() {
      try {
        await fetchOrder();
      } catch (err) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setIsFetched(true);
      }
    }
    loadOrder();
  }, [fetchOrder]);

  const handleQuantityChange = async (orderItemId, newQuantity, itemName) => {
    if (!orderItemId) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    if (newQuantity < 1) return;
    setIsUpdating((prev) => ({ ...prev, [orderItemId]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/update/${orderItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderItemId, quantity: newQuantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quantity');
      }
      await fetchOrder();
      setQuantityUpdate({ id: orderItemId, name: itemName, quantity: newQuantity });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'update_order_quantity', { orderItemId, quantity: newQuantity });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating((prev) => ({ ...prev, [orderItemId]: false }));
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
    if (hasDiagnosticsWithoutDetails) {
      toast.error('Please select a time slot and fulfillment type for all diagnostic services before proceeding to checkout', { duration: 4000 });
      return;
    }
    if (hasMedicationsWithoutDelivery) {
      toast.error('Please select a delivery method for all medication items before proceeding to checkout', { duration: 4000 });
      return;
    }
    router.push('/med/checkout');
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Your Order
        </h1>
        <ErrorMessage error={error} />
        <OrderDialog
          openOrderDialog={openOrderDialog}
          setOpenOrderDialog={setOpenOrderDialog}
          lastAddedItem={lastAddedItem}
          serviceType={lastAddedItemDetails?.serviceType}
          lastAddedItemDetails={lastAddedItemDetails}
        />
        {!isFetched ? null : !order?.providers?.length ? (
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
            {order.providers.map((provider) => (
              <ProviderOrderCard
                key={provider.provider.id}
                provider={provider}
                handleQuantityChange={handleQuantityChange}
                setRemoveItem={setRemoveItem}
                isUpdating={isUpdating}
                calculateItemPrice={calculateItemPrice}
                setOpenOrderDialog={setOpenOrderDialog}
                setLastAddedItemDetails={setLastAddedItemDetails}
              />
            ))}
            <OrderSummary order={order} handleCheckout={handleCheckout} />
          </div>
        )}
      </div>
    </div>
  );
}