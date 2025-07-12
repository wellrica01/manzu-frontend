'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import dynamic from 'next/dynamic';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from './EmptyCart';
import RemoveItemDialog from './RemoveItemDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import PharmacyCartCard from './PharmacyCartCard';
import CartSummary from './CartSummary';
import PrescriptionUploadSection from './PrescriptionUploadSection';
import { getCartSegments, getCartStatus, canProceedToCheckout } from '@/lib/cartUtils';

export default function Cart() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [prescriptionStatuses, setPrescriptionStatuses] = useState({});
  const router = useRouter();
  const { cart, fetchCart, guestId } = useCart();

  useEffect(() => {
    async function loadCart() {
      try {
        await fetchCart();
      } catch (err) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setIsFetched(true);
      }
    }
    loadCart();
  }, [fetchCart]);

  // Load prescription statuses when cart is loaded
  useEffect(() => {
    async function loadPrescriptionStatuses() {
      if (!guestId || !cart || !cart.pharmacies) return;

      const prescriptionItems = cart.pharmacies
        .flatMap(pharmacy => pharmacy.items || [])
        .filter(item => item.medication?.prescriptionRequired);

      if (prescriptionItems.length === 0) return;

      try {
        const medicationIds = prescriptionItems
          .map(item => item.pharmacyMedicationMedicationId)
          .join(',');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/status?patientIdentifier=${guestId}&medicationIds=${medicationIds}`,
          { headers: { 'x-guest-id': guestId } }
        );

        if (response.ok) {
          const statusData = await response.json();
          setPrescriptionStatuses(statusData || {});
        }
      } catch (err) {
        console.error('Failed to load prescription statuses:', err);
      }
    }

    loadPrescriptionStatuses();
  }, [guestId, cart]);

  const handleQuantityChange = async (orderItemId, newQuantity, itemName) => {
    if (!orderItemId) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    if (newQuantity < 1) return;
    setIsUpdating((prev) => ({ ...prev, [orderItemId]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/update`, {
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
      await fetchCart();
      setQuantityUpdate({ id: orderItemId, name: itemName, quantity: newQuantity });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'update_cart_quantity', { orderItemId, quantity: newQuantity });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${removeItem.id}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      await fetchCart();
      setRemoveItem(null);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_cart', { orderItemId: removeItem.id });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating((prev) => ({ ...prev, [removeItem.id]: false }));
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handlePrescriptionUploadSuccess = async () => {
    await fetchCart();
    toast.success('Prescription uploaded successfully. Please wait for verification.', { duration: 4000 });
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  // Get cart segments and status
  const segments = getCartSegments(cart);
  const cartStatus = getCartStatus(segments);
  const canCheckout = canProceedToCheckout(segments);

  // Group items by pharmacy for display
  const groupItemsByPharmacy = (items) => {
    const grouped = {};
    items.forEach(item => {
      const pharmacyId = item.pharmacy.id;
      if (!grouped[pharmacyId]) {
        grouped[pharmacyId] = {
          pharmacy: item.pharmacy,
          items: [],
          subtotal: 0
        };
      }
      grouped[pharmacyId].items.push(item);
      grouped[pharmacyId].subtotal += item.price * item.quantity;
    });
    return Object.values(grouped);
  };

  const readyPharmacies = groupItemsByPharmacy(segments.readyForCheckout);
  const prescriptionPharmacies = groupItemsByPharmacy(segments.needsPrescription);

  // Get cart type for better UX
  const getCartType = () => {
    const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    const hasPrescription = segments.needsPrescription.length > 0;
    const hasVerified = segments.readyForCheckout.some(item => item.medication.prescriptionRequired);

    if (hasOTC && hasPrescription) return 'mixed';
    if (hasOTC && !hasPrescription) return 'otc_only';
    if (hasPrescription && !hasOTC) return 'prescription_only';
    return 'empty';
  };

  const cartType = getCartType();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#225F91] mb-6 text-center">
          Your Cart
        </h1>
        
        <ErrorMessage error={error} />
        
        {!isFetched ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1ABA7F]"></div>
          </div>
        ) : cart.pharmacies.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-6">
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

            {/* Cart Type Indicator */}
            {cartType !== 'empty' && (
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  cartType === 'otc_only' ? 'bg-green-100 text-green-800' :
                  cartType === 'prescription_only' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {cartType === 'otc_only' && '🛒 All items ready for checkout'}
                  {cartType === 'prescription_only' && '📋 Prescription upload required'}
                  {cartType === 'mixed' && '🔄 Mixed order - some items ready, others need prescriptions'}
                </div>
              </div>
            )}

            {/* Ready for Checkout Section */}
            {readyPharmacies.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-green-800">Ready for Checkout</h2>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {segments.readyItemsCount} items
                  </span>
                </div>
                
                {readyPharmacies.map((pharmacy) => (
                  <PharmacyCartCard
                    key={pharmacy.pharmacy.id}
                    pharmacy={pharmacy}
                    handleQuantityChange={handleQuantityChange}
                    setRemoveItem={setRemoveItem}
                    isUpdating={isUpdating}
                    calculateItemPrice={calculateItemPrice}
                    segment="ready"
                  />
                ))}
              </div>
            )}

            {/* Prescription Required Section */}
            {prescriptionPharmacies.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-orange-800">Prescription Required</h2>
                  <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    {segments.prescriptionItemsCount} items
                  </span>
                </div>

                {prescriptionPharmacies.map((pharmacy) => (
                  <PharmacyCartCard
                    key={pharmacy.pharmacy.id}
                    pharmacy={pharmacy}
                    handleQuantityChange={handleQuantityChange}
                    setRemoveItem={setRemoveItem}
                    isUpdating={isUpdating}
                    calculateItemPrice={calculateItemPrice}
                    segment="prescription"
                  />
                ))}

                <PrescriptionUploadSection
                  items={segments.needsPrescription}
                  guestId={guestId}
                  onUploadSuccess={handlePrescriptionUploadSuccess}
                  prescriptionStatuses={prescriptionStatuses}
                />
              </div>
            )}

            {/* Cart Summary */}
            <CartSummary 
              cart={cart} 
              segments={segments}
              handleCheckout={handleCheckout}
              canCheckout={canCheckout}
              cartType={cartType}
            />
          </div>
        )}
      </div>
    </div>
  );
}