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
import { ShoppingCart, ArrowLeft, Sparkles, Clock, CheckCircle, Package, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Cart() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptionStatuses, setPrescriptionStatuses] = useState({});
  const [activeTab, setActiveTab] = useState('ready');
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/status?medicationIds=${medicationIds}`,
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

  // Poll for prescription status updates every 30 seconds
  useEffect(() => {
    if (!guestId || !cart || !cart.pharmacies) return;

    const prescriptionItems = cart.pharmacies
      .flatMap(pharmacy => pharmacy.items || [])
      .filter(item => item.medication?.prescriptionRequired);

    if (prescriptionItems.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const medicationIds = prescriptionItems
          .map(item => item.pharmacyMedicationMedicationId)
          .join(',');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/status?medicationIds=${medicationIds}`,
          { headers: { 'x-guest-id': guestId } }
        );

        if (response.ok) {
          const statusData = await response.json();
          const currentStatuses = prescriptionStatuses;
          
          // Check if any prescription status changed to 'verified'
          const newlyVerified = Object.keys(statusData).filter(medId => 
            statusData[medId] === 'verified' && currentStatuses[medId] !== 'verified'
          );

          if (newlyVerified.length > 0) {
            // Refresh cart data to get updated order status
            await fetchCart();
            toast.success('Your prescription has been verified! 🎉', { duration: 5000 });
          }

          setPrescriptionStatuses(statusData || {});
        }
      } catch (err) {
        console.error('Failed to poll prescription statuses:', err);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [guestId, cart, prescriptionStatuses]);

  const handleRefreshCart = async () => {
    setIsRefreshing(true);
    try {
      await fetchCart();
      toast.success('Cart updated successfully', { duration: 2000 });
    } catch (err) {
      toast.error('Failed to refresh cart', { duration: 4000 });
    } finally {
      setIsRefreshing(false);
    }
  };

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
    // Refresh prescription statuses after upload
    if (guestId && cart && cart.pharmacies) {
      const prescriptionItems = cart.pharmacies
        .flatMap(pharmacy => pharmacy.items || [])
        .filter(item => item.medication?.prescriptionRequired);

      if (prescriptionItems.length > 0) {
        try {
          const medicationIds = prescriptionItems
            .map(item => item.pharmacyMedicationMedicationId)
            .join(',');

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/status?medicationIds=${medicationIds}`,
            { headers: { 'x-guest-id': guestId } }
          );

          if (response.ok) {
            const statusData = await response.json();
            setPrescriptionStatuses(statusData || {});
          }
        } catch (err) {
          console.error('Failed to refresh prescription statuses:', err);
        }
      }
    }
    toast.success('Prescription uploaded successfully. Please wait for verification.', { duration: 4000 });
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  // Get cart segments and status
  const segments = getCartSegments(cart);
  const cartStatus = getCartStatus(segments);
  const canCheckout = canProceedToCheckout(segments);
  
  // Check if cart is in pending_prescription status
  const isPendingPrescription = cart?.orderStatus === 'pending_prescription';

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
  const prescriptionPharmacies = groupItemsByPharmacy([...segments.needsPrescription, ...segments.pendingPrescription]);

  // Get cart type for better UX
  const getCartType = () => {
    const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    const hasPrescription = segments.needsPrescription.length > 0;
    const hasVerified = segments.readyForCheckout.some(item => item.medication.prescriptionRequired && item.prescriptionStatus === 'verified');
    const hasPending = segments.pendingPrescription.length > 0;

    // If we have verified prescription items, treat them as ready items
    if (hasVerified && !hasOTC && !hasPrescription && !hasPending) {
      return 'verified_prescription_only';
    }
    if (hasOTC && hasPrescription) return 'mixed';
    if (hasOTC && !hasPrescription && !hasVerified) return 'otc_only';
    if (hasPrescription && !hasOTC && !hasVerified) return 'prescription_only';
    if (hasVerified && hasOTC) return 'mixed';
    // Handle case where we have both verified and pending prescription items
    if (hasVerified && hasPrescription) return 'mixed';
    return 'empty';
  };

  const cartType = getCartType();

  // Check if tabs should be visible
  const shouldShowTabs = () => {
    const hasReadyItems = segments.readyForCheckout.length > 0;
    const hasPendingItems = segments.needsPrescription.length > 0;
    const hasPendingPrescriptionItems = segments.pendingPrescription.length > 0;
    const hasVerifiedItems = segments.readyForCheckout.some(item => item.medication.prescriptionRequired && item.prescriptionStatus === 'verified');
    const hasOTCItems = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    
    // Show tabs if we have both ready items (OTC or verified) and pending items (needs prescription or pending prescription)
    return (hasReadyItems && (hasPendingItems || hasPendingPrescriptionItems)) || (hasVerifiedItems && (hasPendingItems || hasPendingPrescriptionItems));
  };

  // Auto-select active tab based on cart content
  useEffect(() => {
    if (readyPharmacies.length > 0 && prescriptionPharmacies.length === 0) {
      setActiveTab('ready');
    } else if (prescriptionPharmacies.length > 0 && readyPharmacies.length === 0) {
      setActiveTab('prescription');
    } else if (readyPharmacies.length > 0 && prescriptionPharmacies.length > 0) {
      setActiveTab('ready'); // Default to ready items
    } else if (segments.readyForCheckout.length > 0 && (segments.needsPrescription.length > 0 || segments.pendingPrescription.length > 0)) {
      setActiveTab('ready'); // Default to ready items for mixed cart
    }
  }, [readyPharmacies.length, prescriptionPharmacies.length, segments.readyForCheckout.length, segments.needsPrescription.length, segments.pendingPrescription.length]);

  // Get context-specific summary data
  const getTabSpecificSummary = () => {
    if (activeTab === 'ready') {
      return {
        title: 'Ready Items Summary',
        items: segments.readyForCheckout,
        totalPrice: segments.totalPrice,
        itemCount: segments.readyItemsCount,
        message: 'These items are ready for immediate checkout',
        type: 'ready'
      };
    } else {
      return {
        title: 'Prescription Items Summary',
        items: segments.needsPrescription,
        totalPrice: segments.prescriptionPrice,
        itemCount: segments.prescriptionItemsCount,
        message: 'Upload prescriptions to proceed with these items',
        type: 'prescription'
      };
    }
  };

  const tabSummary = getTabSpecificSummary();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#1ABA7F]/20 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 rounded-full hover:bg-[#1ABA7F]/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2"
                aria-label="Go back to home"
              >
                <ArrowLeft className="h-5 w-5 text-[#225F91]" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-xl shadow-sm">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#225F91]">Your Cart</h1>
                  <p className="text-sm text-gray-500">
                    {cart?.pharmacies?.length || 0} pharmacies • {segments.readyItemsCount + segments.prescriptionItemsCount} items
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Cart Status Badge */}
            {cartType !== 'empty' && (
              <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${
                cartType === 'otc_only' ? 'bg-green-100 text-green-700 border border-green-200' :
                cartType === 'prescription_only' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                'bg-[#1ABA7F]/10 text-[#225F91] border border-[#1ABA7F]/20'
              }`}>
                {cartType === 'otc_only' && <CheckCircle className="h-4 w-4 inline mr-2" />}
                {cartType === 'prescription_only' && <Clock className="h-4 w-4 inline mr-2" />}
                {cartType === 'mixed' && <Sparkles className="h-4 w-4 inline mr-2" />}
                {cartType === 'otc_only' && 'Ready'}
                {cartType === 'prescription_only' && 'Pending'}
                {cartType === 'mixed' && 'Mixed'}
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefreshCart}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-[#1ABA7F]/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 disabled:opacity-50"
              aria-label="Refresh cart"
            >
              {isRefreshing ? (
                <Loader2 className="h-5 w-5 text-[#1ABA7F] animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-[#225F91]" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage error={error} />
        
        {!isFetched ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1ABA7F]/20 border-t-[#1ABA7F]"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#225F91]/40 animate-pulse"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading your cart...</p>
              <p className="text-sm text-gray-400">Please wait while we fetch your items</p>
            </div>
          </div>
        ) : cart.pharmacies.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="max-w-6xl mx-auto lg:flex lg:gap-8">
            <div className="flex-1 min-w-0">
              {/* Enhanced Context-Aware Prescription Status Banner */}
              {activeTab === 'prescription' && isPendingPrescription && (
                <div className="mb-8 p-6 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 border border-[#225F91]/20 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#225F91]/20 rounded-xl">
                      <Clock className="h-6 w-6 text-[#225F91]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Prescription Under Review</h3>
                      <p className="text-[#225F91] leading-relaxed">
                        Your prescription has been uploaded and is being reviewed by our pharmacy team. 
                        You'll be notified once verification is complete.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-[#225F91]">
                        <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-pulse"></div>
                        <span>Review in progress...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Prescription Verified Success Banner */}
              {activeTab === 'ready' && segments.readyForCheckout.some(item => item.prescriptionStatus === 'verified') && 
                !segments.needsPrescription.length && !segments.pendingPrescription.length && (
                <div className="mb-8 p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-green-100/50 border border-[#1ABA7F]/20 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#1ABA7F]/20 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Prescription Verified!</h3>
                      <p className="text-[#225F91] leading-relaxed">
                        Your prescription has been verified and is now ready for checkout. You can proceed to payment anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Ready Items Success Banner */}
              {activeTab === 'ready' && readyPharmacies.length > 0 && prescriptionPharmacies.length > 0 && 
                !segments.readyForCheckout.some(item => item.prescriptionStatus === 'verified') && (
                <div className="mb-8 p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-green-100/50 border border-[#1ABA7F]/20 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#1ABA7F]/20 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Ready for Checkout</h3>
                      <p className="text-[#225F91] leading-relaxed">
                        These items are ready for immediate checkout. You can proceed to payment anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Enhanced Smart Tab Navigation */}
              {shouldShowTabs() && (
                <div className="mb-8">
                  <div className="flex bg-gray-100 rounded-2xl p-1.5 shadow-sm">
                    <button
                      onClick={() => setActiveTab('ready')}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 ${
                        activeTab === 'ready'
                          ? 'bg-white text-[#1ABA7F] shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Ready ({segments.readyItemsCount})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('prescription')}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 ${
                        activeTab === 'prescription'
                          ? 'bg-white text-[#1ABA7F] shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span>Pending ({segments.prescriptionItemsCount + segments.pendingItemsCount})</span>
                    </button>
                  </div>
              </div>
            )}

              {/* Enhanced Content Sections */}
              <div className="space-y-8">
            {/* Ready for Checkout Section */}
                {readyPharmacies.length > 0 && (activeTab === 'ready' || prescriptionPharmacies.length === 0) && (
                  <div className="space-y-6">
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
                {prescriptionPharmacies.length > 0 && (activeTab === 'prescription' || readyPharmacies.length === 0) && (
                  <div className="space-y-6">
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

                {/* Enhanced Mobile Cart Summary */}
                <div className="lg:hidden">
                  <CartSummary 
                    cart={cart} 
                    segments={segments}
                    handleCheckout={handleCheckout}
                    canCheckout={canCheckout}
                    cartType={cartType}
                    activeTab={activeTab}
                    tabSummary={tabSummary}
                  />
                </div>
              </div>
            </div>
            {/* Enhanced Desktop Cart Summary - sticky, not fixed */}
            <div className="hidden lg:block lg:w-80 lg:shrink-0 lg:sticky lg:top-24">
            <CartSummary 
              cart={cart} 
              segments={segments}
              handleCheckout={handleCheckout}
              canCheckout={canCheckout}
              cartType={cartType}
                activeTab={activeTab}
                tabSummary={tabSummary}
            />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}