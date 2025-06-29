'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOrder } from '@/hooks/useOrder';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyOrder from './EmptyOrder';
import RemoveItemDialog from './RemoveItemDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import OrderItem from './OrderItem';
import OrderSummary from './OrderSummary';
import OrderDialog from '../search/OrderDialog';
import UploadPrescriptionModal from './UploadPrescriptionModal';
import PartialCheckoutModal from './PartialCheckoutModal';
import OrderStatusBanner from './OrderStatusBanner';
import { getStatusSummary } from '@/lib/utils';

export default function Order() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItemDetails, setLastAddedItemDetails] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(null);
  const [openPartialCheckoutModal, setOpenPartialCheckoutModal] = useState(false);
  const [partialCheckoutOrderId, setPartialCheckoutOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('cart');
  const [cartSubTab, setCartSubTab] = useState('medications');
  const [pendingSubTab, setPendingSubTab] = useState('medications');
  const router = useRouter();
  const { orders, fetchOrders, updateOrderItem, guestId, isPending, isError, error: fetchError } = useOrder();

  // Define cartOrder and pendingPrescriptionOrders at component level
  const cartOrder = orders.find((o) => o.status === 'cart');
  const pendingPrescriptionOrders = orders.filter((o) =>
    ['partially_completed', 'pending_prescription'].includes(o.status)
  );

  useEffect(() => {
    async function loadOrders() {
      try {
        await fetchOrders();
      } catch (err) {
        setError(err.message);
        toast.error(err.message.includes('404') ? 'No orders found' : `Failed to load orders: ${err.message}`, { duration: 4000 });
      } finally {
        setIsFetched(true);
      }
    }
    loadOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (isFetched) {
      console.log('Orders state:', { orders, cartOrder, pendingPrescriptionOrders });
      if (!cartOrder && pendingPrescriptionOrders.length > 0) {
        setActiveTab('pending');
      } else if (cartOrder && pendingPrescriptionOrders.length === 0) {
        setActiveTab('cart');
      }
    }
  }, [isFetched, orders, cartOrder, pendingPrescriptionOrders]);

  useEffect(() => {
    if (openPartialCheckoutModal) {
      console.log('Refetching order for partial checkout modal:', partialCheckoutOrderId);
      fetchOrders({ orderId: partialCheckoutOrderId }).catch((err) => {
        console.error('Failed to refetch order:', err);
        toast.error(err.message.includes('404') ? 'Order not found' : `Failed to refresh order data: ${err.message}`, { duration: 4000 });
      });
    }
  }, [openPartialCheckoutModal, partialCheckoutOrderId, fetchOrders]);

  useEffect(() => {
    if (openPartialCheckoutModal) {
      const payableItems = getPayableItemsForOrder(partialCheckoutOrderId);
      if (!payableItems.length) {
        console.log('No payable items found after refetch for order:', partialCheckoutOrderId);
        toast.error('No items available for partial checkout', { duration: 4000 });
        setOpenPartialCheckoutModal(false);
      }
    }
  }, [openPartialCheckoutModal, partialCheckoutOrderId, orders]);

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
        type: orders
          .flatMap((order) => order.providers.flatMap((p) => p.items))
          .find((item) => item.id === itemId)?.service.type,
      });
      await fetchOrders({ orderId: orders.find((o) => o.items?.some((i) => i.id === itemId))?.orderId });
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
      const orderId = orders.find((o) => o.items?.some((i) => i.id === removeItem.id))?.orderId;
      await fetchOrders({ orderId });
      setRemoveItem(null);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_order', { orderItemId: removeItem.id });
      }
    } catch (err) {
      toast.error(err.message.includes('404') ? 'Item not found' : `Failed to remove item: ${err.message}`, { duration: 4000 });
    } finally {
      setIsUpdating((prev) => ({ ...prev, [removeItem.id]: false }));
    }
  };

  const handleCheckout = (orderId) => {
    const order = orders.find((o) => o.orderId === orderId);
    const hasDiagnosticsWithoutDetails = order?.providers.some((provider) =>
      provider.items.some(
        (item) => item.service.type === 'diagnostic' && (!item.timeSlotStart || !item.fulfillmentMethod)
      )
    );
    const hasMedicationsWithoutDelivery = order?.providers.some((provider) =>
      provider.items.some(
        (item) => item.service.type === 'medication' && !item.fulfillmentMethod
      )
    );
    const hasUnverifiedPrescriptions = order?.providers.some((provider) =>
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
    router.push(`/checkout?orderId=${orderId}`);
  };

  const handlePartialCheckout = async (orderId) => {
    console.log('handlePartialCheckout called for order:', orderId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/partial-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process partial checkout');
      }
      const { newOrderId } = await response.json();
      await fetchOrders({ orderId: newOrderId });
      toast.success('Ready items sent to checkout', { duration: 4000 });
      return { newOrderId };
    } catch (error) {
      console.error('Partial checkout error:', error.message);
      toast.error(error.message.includes('404') ? 'Order not found' : `Partial checkout failed: ${error.message}`, { duration: 4000 });
      throw error;
    }
  };

  const calculateItemPrice = (item) => (item.quantity || 0) * (item.price || 0);

  const groupItemsByType = (order) => {
    const medicationItems = order.providers.flatMap((provider) =>
      provider.items
        .filter((item) => item.service.type === 'medication')
        .map((item) => ({ ...item, provider: provider.provider }))
    );
    const diagnosticItems = order.providers.flatMap((provider) =>
      provider.items
        .filter((item) => item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package')
        .map((item) => ({ ...item, provider: provider.provider }))
    );
    return { medications: medicationItems, diagnostics: diagnosticItems };
  };

  const getPayableItemsForOrder = (orderId) => {
    return orders
      .filter((o) => o.orderId === orderId)
      .flatMap((order) =>
        order.providers.flatMap((provider) =>
          provider.items
            .filter(
              (item) =>
                !item.service.prescriptionRequired ||
                item.prescriptions?.some((p) => p.status === 'verified')
            )
            .map((item) => ({ ...item, orderId: order.orderId }))
        )
      );
  };

  const getTotalPriceForOrder = (orderId) => {
    return getPayableItemsForOrder(orderId).reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
      0
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown Date';
      }
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Lagos',
      });
    } catch {
      return 'Unknown Date';
    }
  };

  const getOrderSummary = (order) => {
    const allItems = order.providers.flatMap((provider) => provider.items);
    const medicationCount = allItems.filter((item) => item.service.type === 'medication').length;
    const diagnosticCount = allItems.filter((item) => item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package').length;
    const totalPrice = allItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    return {
      itemCount: allItems.length,
      medicationCount,
      diagnosticCount,
      totalPrice,
      statusSummary: getStatusSummary(allItems),
    };
  };

  useEffect(() => {
    if (openPartialCheckoutModal) {
      console.log('PartialCheckoutModal props:', {
        orderId: partialCheckoutOrderId,
        items: getPayableItemsForOrder(partialCheckoutOrderId),
        totalPrice: getTotalPriceForOrder(partialCheckoutOrderId),
      });
    }
  }, [openPartialCheckoutModal, partialCheckoutOrderId, orders]);

  const renderOrderContent = (order, subTab, setSubTab, isPending = false) => {
    const { medications, diagnostics } = groupItemsByType(order);
    const hasBothTypes = medications.length > 0 && diagnostics.length > 0;

    return (
      <div>
        {hasBothTypes && (
          <div className="flex space-x-4 mb-6 border-b border-gray-200" role="tablist">
            <button
              className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${
                subTab === 'medications'
                  ? 'text-[#225F91] border-b-2 border-[#1ABA7F]'
                  : 'text-gray-500 hover:text-[#225F91]'
              }`}
              onClick={() => setSubTab('medications')}
              aria-selected={subTab === 'medications'}
              role="tab"
            >
              Medications
            </button>
            <button
              className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${
                subTab === 'diagnostics'
                  ? 'text-[#225F91] border-b-2 border-[#1ABA7F]'
                  : 'text-gray-500 hover:text-[#225F91]'
              }`}
              onClick={() => setSubTab('diagnostics')}
              aria-selected={subTab === 'diagnostics'}
              role="tab"
            >
              Lab/Diagnostic Items
            </button>
          </div>
        )}
        {(!hasBothTypes || subTab === 'medications') && medications.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#225F91]">Medications</h3>
              {medications.some((item) => item.service.prescriptionRequired) && (
                <Button
                  className="h-12 px-6 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                  onClick={() => setOpenUploadModal({ type: 'medication', orderId: order.orderId })}
                  aria-label={`Upload prescription for medications in ${isPending ? `Order #${order.orderId}` : 'Active Cart'}`}
                >
                  Upload Prescription
                </Button>
              )}
            </div>
            <p className="text-lg font-semibold text-[#225F91] mb-4" id={`medication-status-${order.orderId}`}>
              {getStatusSummary(medications)}
            </p>
            <div className="space-y-4">
              {medications.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  providerName={item.provider.name}
                  providerAddress={item.provider.address}
                  handleQuantityChange={handleQuantityChange}
                  setRemoveItem={setRemoveItem}
                  isUpdating={isUpdating}
                  calculateItemPrice={calculateItemPrice}
                  setOpenOrderDialog={setOpenOrderDialog}
                  setLastAddedItemDetails={setLastAddedItemDetails}
                  setIsEditMode={setIsEditMode}
                  setOpenUploadModal={(modalProps) => setOpenUploadModal({ ...modalProps, orderId })}
                  fetchOrders={fetchOrders}
                />
              ))}
            </div>
          </div>
        )}
        {(!hasBothTypes || subTab === 'diagnostics') && diagnostics.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#225F91]">Lab/Diagnostic Items</h3>
              {diagnostics.some((item) => item.service.prescriptionRequired) && (
                <Button
                  className="h-12 px-6 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                  onClick={() => setOpenUploadModal({ type: 'diagnostic', orderId: order.orderId })}
                  aria-label={`Upload lab request for diagnostics in ${isPending ? `Order #${order.orderId}` : 'Active Cart'}`}
                >
                  Upload Lab Request
                </Button>
              )}
            </div>
            <p className="text-lg font-semibold text-[#225F91] mb-4" id={`diagnostic-status-${order.orderId}`}>
              {getStatusSummary(diagnostics)}
            </p>
            <div className="space-y-4">
              {diagnostics.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  providerName={item.provider.name}
                  providerAddress={item.provider.address}
                  handleQuantityChange={handleQuantityChange}
                  setRemoveItem={setRemoveItem}
                  isUpdating={isUpdating}
                  calculateItemPrice={calculateItemPrice}
                  setOpenOrderDialog={setOpenOrderDialog}
                  setLastAddedItemDetails={setLastAddedItemDetails}
                  setIsEditMode={setIsEditMode}
                  setOpenUploadModal={(modalProps) => setOpenUploadModal({ ...modalProps, orderId })}
                  fetchOrders={fetchOrders}
                />
              ))}
            </div>
          </div>
        )}
        <OrderSummary
          order={order}
          handleCheckout={() => handleCheckout(order.orderId)}
          handlePartialCheckout={() => {
            setPartialCheckoutOrderId(order.orderId);
            setOpenPartialCheckoutModal(true);
          }}
          hasPayableItems={order.providers.some((provider) =>
            provider.items.some(
              (item) =>
                !item.service.prescriptionRequired ||
                item.prescriptions?.some((p) => p.status === 'verified')
            )
          )}
          allPrescriptionsVerified={!order.providers.some((provider) =>
            provider.items.some(
              (item) => item.service.prescriptionRequired && (!item.prescriptions?.length || !item.prescriptions.some(p => p.status === 'verified'))
            )
          )}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Your Order
        </h1>
        <ErrorMessage error={error || (isError ? fetchError.message : null)} />
        {isPending ? (
          <div className="text-center text-gray-600">Loading orders...</div>
        ) : !isFetched ? null : !orders.length ? (
          <EmptyOrder />
        ) : (
          <div className="space-y-12">
            {(cartOrder || pendingPrescriptionOrders.length > 0) && (
              <div className="flex space-x-4 mb-8 border-b border-gray-200" role="tablist">
                {cartOrder && (
                  <button
                    className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${
                      activeTab === 'cart'
                        ? 'text-[#225F91] border-b-2 border-[#1ABA7F]'
                        : 'text-gray-500 hover:text-[#225F91]'
                    }`}
                    onClick={() => setActiveTab('cart')}
                    aria-selected={activeTab === 'cart'}
                    role="tab"
                  >
                    Active Cart
                  </button>
                )}
                {pendingPrescriptionOrders.length > 0 && (
                  <button
                    className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${
                      activeTab === 'pending'
                        ? 'text-[#225F91] border-b-2 border-[#1ABA7F]'
                        : 'text-gray-500 hover:text-[#225F91]'
                    }`}
                    onClick={() => setActiveTab('pending')}
                    aria-selected={activeTab === 'pending'}
                    role="tab"
                  >
                    Pending Prescriptions
                  </button>
                )}
              </div>
            )}
            {activeTab === 'cart' && cartOrder && (
              <div>
                <h2 className="text-3xl font-bold text-[#225F91] mb-6">Active Cart</h2>
                <div className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-lg shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
                  {renderOrderContent(cartOrder, cartSubTab, setCartSubTab)}
                </div>
              </div>
            )}
            {activeTab === 'pending' && pendingPrescriptionOrders.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-[#225F91] mb-6">Pending Prescriptions</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {pendingPrescriptionOrders.map((order) => {
                    const { itemCount, medicationCount, diagnosticCount, totalPrice, statusSummary } = getOrderSummary(order);
                    return (
                      <AccordionItem
                        key={order.orderId}
                        value={`order-${order.orderId}`}
                        className="border border-[#1ABA7F]/20 rounded-lg bg-white/95"
                      >
                        <AccordionTrigger
                          className="px-6 py-4 text-left hover:bg-[#1ABA7F]/10"
                          aria-label={`Toggle details for Order #${order.orderId}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <h3 className="text-xl font-semibold text-[#225F91]">
                                Order #{order.orderId}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Created: {formatDate(order.createdAt)} | {itemCount} Items ({medicationCount} Medications, {diagnosticCount} Diagnostics) | Total: ₦{(totalPrice / 100 || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-[#225F91]">{statusSummary}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4">
                          <OrderStatusBanner
                            hasPending={order.providers.some((provider) =>
                              provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending'))
                            )}
                            hasRejected={order.providers.some((provider) =>
                              provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected'))
                            )}
                            hasVerified={order.providers.some((provider) =>
                              provider.items.some((item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified'))
                            )}
                            onReupload={() => setOpenUploadModal({ type: 'medication', orderId: order.orderId })}
                          />
                          {renderOrderContent(order, pendingSubTab, setPendingSubTab, true)}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}
            <OrderDialog
              openOrderDialog={openOrderDialog}
              setOpenOrderDialog={setOpenOrderDialog}
              lastAddedItem={lastAddedItem}
              serviceType={lastAddedItemDetails?.serviceType}
              lastAddedItemDetails={lastAddedItemDetails}
              isEditMode={isEditMode}
              fetchOrders={fetchOrders}
            />
            <UploadPrescriptionModal
              open={!!openUploadModal}
              onClose={() => setOpenUploadModal(null)}
              type={openUploadModal?.type}
              items={openUploadModal?.type === 'medication'
                ? orders.find(o => o.orderId === openUploadModal?.orderId)?.providers.flatMap((provider) => provider.items.filter((item) => item.service.type === 'medication')) || []
                : orders.find(o => o.orderId === openUploadModal?.orderId)?.providers.flatMap((provider) => provider.items.filter((item) => item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package')) || []
              }
              orderId={openUploadModal?.orderId}
              fetchOrders={fetchOrders}
              orderLabel={openUploadModal?.orderId === cartOrder?.orderId ? 'Active Cart' : `Order #${openUploadModal?.orderId}`}
            />
            <PartialCheckoutModal
              open={openPartialCheckoutModal}
              onClose={() => {
                setOpenPartialCheckoutModal(false);
                setPartialCheckoutOrderId(null);
              }}
              items={getPayableItemsForOrder(partialCheckoutOrderId)}
              totalPrice={getTotalPriceForOrder(partialCheckoutOrderId)}
              handlePartialCheckout={() => handlePartialCheckout(partialCheckoutOrderId)}
              orderLabel={partialCheckoutOrderId === cartOrder?.orderId ? 'Active Cart' : `Order #${partialCheckoutOrderId}`}
            />
            <RemoveItemDialog
              removeItem={removeItem}
              setRemoveItem={setRemoveItem}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
            />
            <QuantityUpdateDialog
              quantityUpdate={quantityUpdate}
              setQuantityUpdate={setQuantityUpdate}
              handleCheckout={() => handleCheckout(cartOrder?.orderId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}