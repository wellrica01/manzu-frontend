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
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Sparkles, Clock, CheckCircle, Package, AlertCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
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
          .map(item => item.medication.id)
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
          .map(item => item.medication.id)
          .join(',');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/status?medicationIds=${medicationIds}`,
          { headers: { 'x-guest-id': guestId } }
        );

        if (response.ok) {
          const statusData = await response.json();
          const currentStatuses = prescriptionStatuses;
          
          // Check if any prescription status changed to 'verified' or 'rejected'
          const newlyVerified = Object.keys(statusData).filter(medId => 
            statusData[medId] === 'VERIFIED' && currentStatuses[medId] !== 'VERIFIED'
          );
          
          const newlyRejected = Object.keys(statusData).filter(medId => 
            statusData[medId] === 'REJECTED' && currentStatuses[medId] !== 'REJECTED'
          );

          if (newlyVerified.length > 0) {
            // Refresh cart data to get updated order status
            await fetchCart();
            toast.success('Your prescription has been verified! 🎉', { duration: 5000 });
          }
          
          if (newlyRejected.length > 0) {
            // Refresh cart data to get updated order status
            await fetchCart();
            toast.error('Your prescription has been rejected. Please upload a new prescription.', { duration: 5000 });
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
    console.log('Cart handleCheckout called');
    console.log('Cart debug - segments:', segments);
    console.log('Cart debug - canCheckout:', canCheckout);
    console.log('Cart debug - readyForCheckout length:', segments.readyForCheckout.length);
    
    if (!canCheckout) {
      console.log('Cart handleCheckout - canCheckout is false, showing error');
      toast.error('No medications ready for checkout. Please complete prescription requirements first.', { duration: 4000 });
      return;
    }
    console.log('Cart handleCheckout - navigating to checkout');
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
            .map(item => item.medication.id)
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

const handleGoBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/'); // fallback to home
  }
};


  const calculateItemPrice = (item) => item.quantity * item.price;

  // Get cart segments and status
  const segments = getCartSegments(cart);
  const cartStatus = getCartStatus(segments);
  const canCheckout = canProceedToCheckout(segments);
  
  // Check if cart has rejected prescriptions
  const hasRejectedPrescriptions = segments.rejectedPrescription.length > 0;
  const isPendingPrescription = cart?.orderStatus === 'pending_prescription' && !hasRejectedPrescriptions;

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
  const prescriptionPharmacies = groupItemsByPharmacy([...segments.needsPrescription, ...segments.pendingPrescription, ...segments.rejectedPrescription]);

  // Get cart type for better UX
  const getCartType = () => {
    const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    const hasPrescription = segments.needsPrescription.length > 0;
    const hasVerified = segments.readyForCheckout.some(item => item.medication.prescriptionRequired && item.prescriptionStatus === 'VERIFIED');
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
    const hasRejectedItems = segments.rejectedPrescription.length > 0;
    const hasVerifiedItems = segments.readyForCheckout.some(item => item.medication.prescriptionRequired && item.prescriptionStatus === 'VERIFIED');
    const hasOTCItems = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    
    // Show tabs if we have multiple different types of items
    const prescriptionTypes = [hasPendingItems, hasPendingPrescriptionItems, hasRejectedItems].filter(Boolean).length;
    return (hasReadyItems && prescriptionTypes > 0) || prescriptionTypes > 1;
  };

  // Get available tabs based on cart content
  const getAvailableTabs = () => {
    const tabs = [];
    
    if (segments.readyForCheckout.length > 0) {
      tabs.push({
        id: 'ready',
        label: 'Ready Medications',
        shortLabel: 'Ready',
        icon: CheckCircle,
        count: segments.readyItemsCount,
        color: 'bg-[#1ABA7F]/10 text-[#1ABA7F]'
      });
    }
    
    if (segments.needsPrescription.length > 0) {
      tabs.push({
        id: 'needs_prescription',
        label: 'Needs Prescription',
        shortLabel: 'Needs Rx',
        icon: AlertCircle,
        count: segments.prescriptionItemsCount,
        color: 'bg-orange-100 text-orange-700'
      });
    }
    
    if (segments.pendingPrescription.length > 0) {
      tabs.push({
        id: 'pending',
        label: 'Under Review',
        shortLabel: 'Review',
        icon: Clock,
        count: segments.pendingItemsCount,
        color: 'bg-blue-100 text-blue-700'
      });
    }
    
    if (segments.rejectedPrescription.length > 0) {
      tabs.push({
        id: 'rejected',
        label: 'Rejected',
        shortLabel: 'Rejected',
        icon: AlertTriangle,
        count: segments.rejectedItemsCount,
        color: 'bg-red-100 text-red-700'
      });
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // Auto-select active tab based on cart content
  useEffect(() => {
    if (availableTabs.length === 0) return;
    
    // Priority order: ready > rejected > pending > needs prescription
    const priorityOrder = ['ready', 'rejected', 'pending', 'needs_prescription'];
    const currentTab = availableTabs.find(tab => tab.id === activeTab);
    
    if (!currentTab || !availableTabs.some(tab => tab.id === activeTab)) {
      // Find the highest priority available tab
      for (const tabId of priorityOrder) {
        const tab = availableTabs.find(t => t.id === tabId);
        if (tab) {
          setActiveTab(tabId);
          break;
        }
      }
    }
  }, [availableTabs, activeTab]);

  // Get context-specific summary data
  const getTabSpecificSummary = () => {
    switch (activeTab) {
      case 'ready':
      return {
          title: 'Ready Medications Summary',
        items: segments.readyForCheckout,
        totalPrice: segments.totalPrice,
        itemCount: segments.readyItemsCount,
          message: 'These medications are ready for immediate checkout',
        type: 'ready'
      };
      case 'needs_prescription':
      return {
          title: 'Needs Prescription Summary',
        items: segments.needsPrescription,
        totalPrice: segments.prescriptionPrice,
        itemCount: segments.prescriptionItemsCount,
          message: 'Upload prescriptions to proceed with these medications',
          type: 'needs_prescription'
        };
      case 'pending':
        return {
          title: 'Under Review Summary',
          items: segments.pendingPrescription,
          totalPrice: segments.pendingPrice,
          itemCount: segments.pendingItemsCount,
          message: 'Your prescriptions are being reviewed by our pharmacy team',
          type: 'pending'
        };
      case 'rejected':
        return {
          title: 'Rejected Prescriptions Summary',
          items: segments.rejectedPrescription,
          totalPrice: segments.rejectedPrice,
          itemCount: segments.rejectedItemsCount,
          message: 'Upload new prescriptions to proceed with these medications',
          type: 'rejected'
        };
      default:
        return {
          title: 'Prescription Medications Summary',
          items: [...segments.needsPrescription, ...segments.pendingPrescription, ...segments.rejectedPrescription],
          totalPrice: segments.prescriptionPrice + segments.pendingPrice + segments.rejectedPrice,
          itemCount: segments.prescriptionItemsCount + segments.pendingItemsCount + segments.rejectedItemsCount,
          message: 'Upload prescriptions to proceed with these medications',
        type: 'prescription'
      };
    }
  };

  const tabSummary = getTabSpecificSummary();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative p-1 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />

        {/* Navigation */}
        <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm py-3 px-3 sm:px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto flex items-center justify-between">
            {/* Left: Back Button */}
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 h-10"
            aria-label="Back to Cart"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

            {/* Center: Title */}
            <h2 className="text-lg sm:text-2xl font-bold text-[#225F91] tracking-tight text-center flex-1">
              Cart
            </h2>

            {/* Right: Refresh + Cart */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshCart}
                disabled={isRefreshing}
                className="group p-3 rounded-xl hover:bg-[#1ABA7F]/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 disabled:opacity-50"
                aria-label="Refresh cart"
              >
                {isRefreshing ? (
                  <Loader2 className="h-5 w-5 text-[#1ABA7F] animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-200" />
                )}
              </button>
              <div className="relative">
                <div className="p-2 text-[#225F91] hover:text-[#1ABA7F] focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-md">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                {cart?.pharmacies?.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-white">
                      {segments.readyItemsCount + segments.prescriptionItemsCount + segments.pendingItemsCount + segments.rejectedItemsCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

      <main className="py-8 px-2 sm:px-4">
        <ErrorMessage error={error} />
        
        {!isFetched ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1ABA7F]/20 border-t-[#1ABA7F]"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#225F91]/40 animate-pulse"></div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your cart...</h2>
                <p className="text-gray-500">Please wait while we fetch your medications</p>
              </div>
            </div>
          </div>
        ) : cart.pharmacies.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="max-w-6xl mx-auto lg:flex lg:gap-8">
            <div className="flex-1 min-w-0">

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

              {/* Professional Tab Navigation */}
              {shouldShowTabs() && (
                <div className="mb-8">
                    <div className="flex bg-gray-50 rounded-xl p-1">
                      {availableTabs.map((tab) => (
                    <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 ${
                            activeTab === tab.id
                              ? `bg-white text-[#1ABA7F] shadow-md transform scale-105 border border-gray-200 ${tab.color}`
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          }`}
                        >
                          <tab.icon className="h-5 w-5" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="text-sm sm:hidden">{tab.shortLabel}</span>
                          <span className={`${tab.color} px-2 py-1 rounded-full text-xs font-bold`}>
                            {tab.count}
                          </span>
                    </button>
                      ))}
                    </div>
                  </div>
              )}

            {/* Enhanced Context-Aware Status Banners */}
            
            {/* Ready Medications Banner */}
            {activeTab === 'ready' && segments.readyForCheckout.some(item => item.prescriptionStatus === 'VERIFIED') && (
              <div className="mb-8 p-3 sm:p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-green-100/50 border border-[#1ABA7F]/20 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1ABA7F]/20 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Prescription Verified! 🎉</h3>
                    <p className="text-[#225F91] text-sm sm:text-base leading-relaxed mb-3">
                      Your prescription has been verified and is now ready for checkout. You can proceed to payment anytime.
                    </p>
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      <span className="text-[#1ABA7F] font-medium">✓ Verified by pharmacy team</span>
                      <span className="text-[#225F91]/60">•</span>
                      <span className="text-[#225F91]/60">Ready for immediate checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OTC Medications Banner */}
            {activeTab === 'ready' && segments.readyForCheckout.some(item => !item.medication.prescriptionRequired) && 
              !segments.readyForCheckout.some(item => item.prescriptionStatus === 'VERIFIED') && (
              <div className="mb-8 p-3 sm:p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-green-100/50 border border-[#1ABA7F]/20 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1ABA7F]/20 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Ready for Checkout</h3>
                    <p className="text-[#225F91] text-sm sm:text-base leading-relaxed mb-3">
                      These medications are ready for immediate checkout. You can proceed to payment anytime.
                    </p>
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      <span className="text-[#1ABA7F] font-medium">✓ OTC medications available</span>
                      <span className="text-[#225F91]/60">•</span>
                      <span className="text-[#225F91]/60">No prescription required</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Needs Prescription Banner */}
            {activeTab === 'needs_prescription' && (
              <div className="mb-8 p-3 sm:p-6 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 mb-2 text-lg">Prescription Required</h3>
                    <p className="text-orange-700 text-sm sm:text-base leading-relaxed mb-3">
                      These medications require a prescription. Please upload your prescription to proceed with checkout.
                    </p>
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      <span className="text-orange-600 font-medium">📋 Upload prescription to continue</span>
                      <span className="text-orange-600/60">•</span>
                      <span className="text-orange-600/60">Prescription will be reviewed within 24-48 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Under Review Banner */}
            {activeTab === 'pending' && (
              <div className="mb-8 p-3 sm:p-6 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 border border-[#225F91]/20 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#225F91]/20 rounded-xl">
                    <Clock className="h-6 w-6 text-[#225F91]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#225F91] mb-2 text-lg">Prescription Under Review</h3>
                    <p className="text-[#225F91] text-sm sm:text-base leading-relaxed mb-3">
                      Your prescription has been uploaded and is being reviewed by our pharmacy team. 
                      You'll be notified once verification is complete.
                    </p>
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-[#225F91]">
                        <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-pulse"></div>
                        <span>Review in progress...</span>
                      </div>
                      <span className="text-[#225F91]/60">•</span>
                      <span className="text-[#225F91]/60">Usually takes 24-48 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Prescriptions Banner */}
            {activeTab === 'rejected' && (
              <div className="mb-8 p-3 sm:p-6 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2 text-lg">Prescription Rejected</h3>
                    <p className="text-red-700 text-sm sm:text-base leading-relaxed mb-3">
                      Your prescription was rejected by our pharmacy team. Please upload a new prescription to proceed with these medications.
                    </p>
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      <span className="text-red-600 font-medium">⚠️ Upload new prescription to continue</span>
                      <span className="text-red-600/60">•</span>
                      <span className="text-red-600/60">Check email for rejection details</span>
                    </div>
                  </div>
                  </div>
              </div>
            )}

              {/* Enhanced Content Sections */}
              <div className="space-y-8">
                {/* Tab-Specific Content (only when tabs are shown) */}
                {shouldShowTabs() && (
                  <>
                    {/* Ready for Checkout Section */}
                    {activeTab === 'ready' && readyPharmacies.length > 0 && (
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

                    {/* Needs Prescription Section */}
                    {activeTab === 'needs_prescription' && segments.needsPrescription.length > 0 && (
                      <div className="space-y-6">
                        {groupItemsByPharmacy(segments.needsPrescription).map((pharmacy) => (
                          <PharmacyCartCard
                            key={pharmacy.pharmacy.id}
                            pharmacy={pharmacy}
                            handleQuantityChange={handleQuantityChange}
                            setRemoveItem={setRemoveItem}
                            isUpdating={isUpdating}
                            calculateItemPrice={calculateItemPrice}
                            segment="needs_prescription"
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

                    {/* Under Review Section */}
                    {activeTab === 'pending' && segments.pendingPrescription.length > 0 && (
                      <div className="space-y-6">
                        {groupItemsByPharmacy(segments.pendingPrescription).map((pharmacy) => (
                          <PharmacyCartCard
                            key={pharmacy.pharmacy.id}
                            pharmacy={pharmacy}
                            handleQuantityChange={handleQuantityChange}
                            setRemoveItem={setRemoveItem}
                            isUpdating={isUpdating}
                            calculateItemPrice={calculateItemPrice}
                            segment="pending"
                          />
                        ))}
                      </div>
                    )}

                    {/* Rejected Prescriptions Section */}
                    {activeTab === 'rejected' && segments.rejectedPrescription.length > 0 && (
                      <div className="space-y-6">
                        {groupItemsByPharmacy(segments.rejectedPrescription).map((pharmacy) => (
                          <PharmacyCartCard
                            key={pharmacy.pharmacy.id}
                            pharmacy={pharmacy}
                            handleQuantityChange={handleQuantityChange}
                            setRemoveItem={setRemoveItem}
                            isUpdating={isUpdating}
                            calculateItemPrice={calculateItemPrice}
                            segment="rejected"
                          />
                        ))}

                        <PrescriptionUploadSection
                          items={segments.rejectedPrescription}
                          guestId={guestId}
                          onUploadSuccess={handlePrescriptionUploadSuccess}
                          prescriptionStatuses={prescriptionStatuses}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Legacy Support for Mixed Content (when no tabs) */}
                {!shouldShowTabs() && (
                  <>
            {/* Ready for Checkout Section */}
                    {readyPharmacies.length > 0 && (
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
                    {prescriptionPharmacies.length > 0 && (
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
                  items={[...segments.needsPrescription, ...segments.rejectedPrescription]}
                  guestId={guestId}
                  onUploadSuccess={handlePrescriptionUploadSuccess}
                  prescriptionStatuses={prescriptionStatuses}
                />
              </div>
                    )}
                  </>
            )}

                {/* Enhanced Mobile Cart Summary */}
                <div >
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
 
          </div>
        )}
      </main>
    </div>
  );
}