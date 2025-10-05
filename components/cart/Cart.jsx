'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from './EmptyCart';
import UnifiedRemoveDialog from './UnifiedRemoveDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import PharmacyCartCard from './PharmacyCartCard';
import CartSummary from './CartSummary';
import PrescriptionUploadSection from './PrescriptionUploadSection';
import { 
  getCartSegments, 
  getCartStatus, 
  canProceedToCheckout,
  calculateItemPrice,
  groupItemsByPharmacy,
  trackEvent,
  deduplicateRequest,
  getCartType,
  getTabSummary

 } from '@/lib/cartUtils';
import { getAvailableTabs } from '@/lib/cartConfig';

import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, AlertTriangle, WifiOff, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';


// Import API functions
import {
  fetchCartData,
  loadPrescriptionStatuses,
  pollPrescriptionStatuses,
  updateCartQuantity,
  removeCartItem,
  bulkRemoveCartItems,
  refreshCartData,
  API_CONSTANTS,
  PrescriptionStatuses,
  isApiConfigured
} from './cartApi';

// Constants
const { POLLING_INTERVAL, MAX_QUANTITY = 99, MIN_QUANTITY = 1 } = API_CONSTANTS;


// Error Boundary Component
class CartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Cart Error:', error, errorInfo);
    trackEvent('cart_error', { error: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden flex items-center justify-center p-4">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
            
            {/* Dot pattern overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #225F91 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
          </div>

          <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 max-w-lg w-full border-2 border-red-200/50">
            {/* Error Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <AlertCircle className="h-12 w-12 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                Oops! Something Went Wrong
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We encountered an issue while loading your cart. This might be a temporary glitch.
              </p>

              {/* Error details card */}
              <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200/50 text-left">
                <p className="text-sm text-gray-700 font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              <Button
                onClick={() => window.location.reload()}
                className="w-full h-14 mt-6 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:from-[#225F91] hover:to-[#1ABA7F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  Refresh Page
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const BulkRemoveActionBar = ({ 
  selectedCount, 
  onRemove, 
  onSelectAll, 
  onClear,
  totalItems,
  isRemoving 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300 w-[90%] sm:w-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-[#1ABA7F]/30 p-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
        {/* Selection Count */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-xl text-sm">
          <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />
          <span className="font-bold text-[#225F91]">{selectedCount} selected</span>
        </div>

        {/* Select All */}
        {selectedCount < totalItems && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-10 border-2 border-[#1ABA7F]/30 text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-semibold text-sm"
          >
            Select All ({totalItems})
          </Button>
        )}

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-10 text-gray-600 hover:bg-gray-100 font-semibold text-sm"
        >
          Clear
        </Button>

        {/* Remove Button */}
        <Button
          onClick={onRemove}
          disabled={isRemoving}
          className="h-12 px-4 sm:px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden text-sm sm:text-base"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isRemoving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                Remove {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
};


function CartComponent() {
  // State
  const [error, setError] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [prescriptionStatuses, setPrescriptionStatuses] = useState({});
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ready');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [removeItem, setRemoveItem] = useState(null);
  const [bulkRemoveItems, setBulkRemoveItems] = useState([]);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  
  // Refs for cleanup and debouncing
  const abortControllerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  const prescriptionStatusesRef = useRef({});

  const router = useRouter();
  const { cart, fetchCart, guestId } = useCart();


// Track entry point when component mounts
  useEffect(() => {
    const currentReferrer = sessionStorage.getItem('cart_referrer');
    
    // Only set entry point if:
    // 1. It doesn't exist yet, AND
    // 2. We're not coming from checkout
    if (!sessionStorage.getItem('cart_entry_point') && currentReferrer !== '/checkout') {
      try {
        const referrerUrl = document.referrer;
        if (referrerUrl) {
          const url = new URL(referrerUrl);
          const path = url.pathname;
          // Don't set cart or checkout as entry points
          if (path !== '/cart' && path !== '/checkout') {
            sessionStorage.setItem('cart_entry_point', path);
          } else {
            sessionStorage.setItem('cart_entry_point', '/');
          }
        } else {
          sessionStorage.setItem('cart_entry_point', '/');
        }
      } catch (e) {
        sessionStorage.setItem('cart_entry_point', '/');
      }
    }
    
    // Clear the cart_referrer flag now that we've used it
    sessionStorage.removeItem('cart_referrer');
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    prescriptionStatusesRef.current = prescriptionStatuses;
  }, [prescriptionStatuses]);

  // Memoized segments calculation
  const segments = useMemo(() => getCartSegments(cart), [cart]);
  const cartStatus = useMemo(() => getCartStatus(segments), [segments]);
  const canCheckout = useMemo(() => canProceedToCheckout(segments), [segments]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', { duration: 2000 });
      // Retry pending actions
      if (pendingActions.length > 0) {
        toast.info('Retrying pending actions...', { duration: 2000 });
        loadCart();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection', { duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions.length]);

  // Fetch cart with error handling
  const loadCart = useCallback(async () => {
    if (!isComponentMountedRef.current || !isApiConfigured()) return;
    
    try {
      await fetchCartData(fetchCart);
      setError(null);
      setPendingActions([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cart';
      setError(message);
      toast.error(message, { duration: 4000 });
      trackEvent('cart_load_error', { error: message });
    } finally {
      if (isComponentMountedRef.current) {
        setIsFetched(true);
      }
    }
  }, [fetchCart]);

  // Load prescription statuses with abort controller
  const loadPrescriptionStatusesData = useCallback(async () => {
    if (!guestId || !cart?.pharmacies || !isApiConfigured()) return;

    const prescriptionItems = cart.pharmacies
      .flatMap(pharmacy => pharmacy.items || [])
      .filter(item => item.medication?.prescriptionRequired);

    if (prescriptionItems.length === 0) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const medicationIds = prescriptionItems.map(item => item.medication.id);

      const statusData = await loadPrescriptionStatuses(
        guestId, 
        medicationIds, 
        abortControllerRef.current.signal
      );
      
      if (isComponentMountedRef.current) {
        setPrescriptionStatuses(statusData);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load prescription statuses:', err);
      }
    }
  }, [guestId, cart]);

  // Initial cart load
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Load prescription statuses when cart changes
  useEffect(() => {
    loadPrescriptionStatusesData();
  }, [loadPrescriptionStatusesData]);

  // Setup polling with Page Visibility API
  useEffect(() => {
    if (!guestId || !cart?.pharmacies || !isApiConfigured()) return;

    const prescriptionItems = cart.pharmacies
      .flatMap(pharmacy => pharmacy.items || [])
      .filter(item => item.medication?.prescriptionRequired);

    // Only poll items that are still pending
    const pendingItems = prescriptionItems.filter(item => {
      const status = prescriptionStatusesRef.current[item.medication.id];
      return !status || status === PrescriptionStatuses.PENDING;
    });

    if (pendingItems.length === 0) return;

    // Polling function
    const pollStatuses = async () => {
      if (document.hidden || !isOnline) return;

      try {
        const medicationIds = pendingItems.map(item => item.medication.id);
        const statusData = await pollPrescriptionStatuses(guestId, medicationIds);

        if (!isComponentMountedRef.current || !statusData) return;

        const currentStatuses = prescriptionStatusesRef.current;

        // Check for status changes
        const newlyVerified = Object.keys(statusData).filter(medId => 
          statusData[medId] === PrescriptionStatuses.VERIFIED && 
          currentStatuses[medId] !== PrescriptionStatuses.VERIFIED
        );
        
        const newlyRejected = Object.keys(statusData).filter(medId => 
          statusData[medId] === PrescriptionStatuses.REJECTED && 
          currentStatuses[medId] !== PrescriptionStatuses.REJECTED
        );

        // Update statuses first
        setPrescriptionStatuses(statusData);

        // Then refresh cart if needed
        if (newlyVerified.length > 0) {
          await fetchCart();
          toast.success('Your prescription has been verified!', { duration: 5000 });
          trackEvent('prescription_verified', { count: newlyVerified.length });
        }
        
        if (newlyRejected.length > 0) {
          await fetchCart();
          toast.error('Your prescription has been rejected. Please upload a new prescription.', { duration: 5000 });
          trackEvent('prescription_rejected', { count: newlyRejected.length });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Polling error:', err);
        }
      }
    };

    // Start polling
    pollingIntervalRef.current = setInterval(pollStatuses, POLLING_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pollStatuses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [guestId, cart?.pharmacies, fetchCart, isOnline]);

  // Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Refresh cart handler
  const handleRefreshCart = async () => {
    if (isRefreshing || !isOnline) {
      if (!isOnline) {
        toast.error('No internet connection', { duration: 3000 });
      }
      return;
    }
    
    setIsRefreshing(true);
    try {
      const medicationIds = cart?.pharmacies
        ?.flatMap(pharmacy => pharmacy.items || [])
        .filter(item => item.medication?.prescriptionRequired)
        .map(item => item.medication.id) || [];

      await refreshCartData(fetchCart, guestId, medicationIds);
      toast.success('Cart updated successfully', { duration: 2000 });
      trackEvent('cart_refreshed');
    } catch (err) {
      toast.error('Failed to refresh cart', { duration: 4000 });
      trackEvent('cart_refresh_error');
    } finally {
      setIsRefreshing(false);
    }
  };


  // Toggle item selection
const handleToggleSelect = useCallback((itemId) => {
  setSelectedItems(prev => {
    const newSet = new Set(prev);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    return newSet;
  });
}, []);

// Select all items
const handleSelectAll = useCallback(() => {
  const allItemIds = [
    ...segments.readyForCheckout,
    ...segments.needsPrescription,
    ...segments.pendingPrescription,
    ...segments.rejectedPrescription
  ].map(item => item.id);
  setSelectedItems(new Set(allItemIds));
}, [segments]);

// Clear selection
const handleClearSelection = useCallback(() => {
  setSelectedItems(new Set());
}, []);


// Bulk remove with API call
const handleBulkRemove = async () => {
  if (selectedItems.size === 0) return;

  // Get full item details for selected items
  const allItems = [
    ...segments.readyForCheckout,
    ...segments.needsPrescription,
    ...segments.pendingPrescription,
    ...segments.rejectedPrescription
  ];
  
    const itemsToRemoveDetails = allItems
    .filter(item => selectedItems.has(item.id))
    .map(item => ({
      id: item.id,
      name: item.medication?.displayName || 'Unknown Item',
      quantity: item.quantity
    }));

  setBulkRemoveItems(itemsToRemoveDetails);
  setShowBulkRemoveDialog(true);
};

// Update the actual bulk remove confirmation
const handleBulkRemoveConfirm = async () => {
  if (selectedItems.size === 0) return;

  setIsBulkRemoving(true);
  const itemIds = [...selectedItems];

  try {
    await bulkRemoveCartItems(guestId, itemIds);
    await fetchCart();
    setSelectedItems(new Set());
    setSelectionMode(false);
    setShowBulkRemoveDialog(false);
    setBulkRemoveItems([]);

    toast.success(`${itemIds.length} items removed from cart`, { duration: 3000 });
    trackEvent('bulk_remove_from_cart', { count: itemIds.length });
  } catch (err) {
    toast.error('Failed to remove items', { duration: 4000 });
    trackEvent('bulk_remove_error', { error: err.message });
  } finally {
    setIsBulkRemoving(false);
  }
};

  // Quantity change handler with validation
  const handleQuantityChange = async (orderItemId, newQuantity, itemName) => {
    if (!orderItemId || !isApiConfigured()) {
      toast.error('Invalid item', { duration: 3000 });
      return;
    }

    if (newQuantity < MIN_QUANTITY || newQuantity > MAX_QUANTITY) {
      toast.error(`Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`, { duration: 3000 });
      return;
    }

    if (!isOnline) {
      toast.error('No internet connection. Changes will be saved when online.', { duration: 4000 });
      setPendingActions(prev => [...prev, { type: 'quantity', orderItemId, newQuantity }]);
      return;
    }

    if (isUpdating[orderItemId]) return;

    setIsUpdating(prev => ({ ...prev, [orderItemId]: true }));

    try {
      await deduplicateRequest(`quantity-${orderItemId}`, async () => {
        await updateCartQuantity(guestId, orderItemId, newQuantity);
      });

      await fetchCart();
      setQuantityUpdate({ id: orderItemId, name: itemName, quantity: newQuantity });
      trackEvent('update_cart_quantity', { orderItemId, quantity: newQuantity });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      toast.error(message, { duration: 4000 });
      trackEvent('update_cart_quantity_error', { orderItemId, error: message });
    } finally {
      if (isComponentMountedRef.current) {
        setIsUpdating(prev => ({ ...prev, [orderItemId]: false }));
      }
    }
  };

  // Remove item handler
  const handleRemoveItem = async () => {
    if (!removeItem?.id || !isApiConfigured()) {
      toast.error('Invalid item', { duration: 3000 });
      return;
    }

    if (!isOnline) {
      toast.error('No internet connection. Please try again when online.', { duration: 4000 });
      return;
    }

    const itemId = removeItem.id;
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));

    try {
      await deduplicateRequest(`remove-${itemId}`, async () => {
        await removeCartItem(guestId, itemId);
      });

      await fetchCart();
      setRemoveItem(null);
      toast.success('Item removed from cart', { duration: 2000 });
      trackEvent('remove_from_cart', { orderItemId: itemId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      toast.error(message, { duration: 4000 });
      trackEvent('remove_from_cart_error', { orderItemId: itemId, error: message });
    } finally {
      if (isComponentMountedRef.current) {
        setIsUpdating(prev => ({ ...prev, [itemId]: false }));
      }
    }
  };

  // Checkout handler
  const handleCheckout = () => {
    if (!canCheckout) {
      toast.error('No medications ready for checkout. Please complete prescription requirements first.', { duration: 4000 });
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection. Please check your connection and try again.', { duration: 4000 });
      return;
    }

   // Mark that we're going to checkout
    sessionStorage.setItem('cart_referrer', '/cart');
    
    trackEvent('checkout_initiated', { totalItems: segments.readyItemsCount });
    router.replace('/checkout');
  };

  // Prescription upload success handler
  const handlePrescriptionUploadSuccess = async () => {
    try {
      await fetchCart();
      await loadPrescriptionStatusesData();
      toast.success('Prescription uploaded successfully. Please wait for verification.', { duration: 4000 });
      trackEvent('prescription_uploaded');
    } catch (err) {
      toast.error('Failed to refresh cart after upload', { duration: 4000 });
    }
  };


// Back navigation handler
const handleGoBack = () => {
  const referrer = document.referrer;
  const isFromCheckout = referrer.includes('/checkout');
  
  if (isFromCheckout) {
    const entryPoint = sessionStorage.getItem('cart_entry_point');
    if (entryPoint && entryPoint !== '/cart' && entryPoint !== '/checkout') {
      router.replace(entryPoint);
    } else {
      router.replace('/');
    }
  } else if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};


  // Memoize pharmacy groups
  const readyPharmacies = useMemo(
    () => groupItemsByPharmacy(segments.readyForCheckout),
    [segments.readyForCheckout, groupItemsByPharmacy]
  );

  const prescriptionPharmacies = useMemo(
    () => groupItemsByPharmacy([
      ...segments.needsPrescription,
      ...segments.pendingPrescription,
      ...segments.rejectedPrescription
    ]),
    [segments, groupItemsByPharmacy]
  );

// Get cart type
const cartType = useMemo(() => getCartType(segments), [segments]);


  // Check if tabs should be visible
  const shouldShowTabs = useCallback(() => {
    const prescriptionTypes = [
      segments.needsPrescription.length > 0,
      segments.pendingPrescription.length > 0,
      segments.rejectedPrescription.length > 0
    ].filter(Boolean).length;
    
    return (segments.readyForCheckout.length > 0 && prescriptionTypes > 0) || prescriptionTypes > 1;
  }, [segments]);

  // Get available tabs
 const availableTabs = useMemo(() => getAvailableTabs(segments), [segments]);


  // Auto-select active tab
  useEffect(() => {
    if (availableTabs.length === 0) return;
    
    const priorityOrder = ['ready', 'rejected', 'pending', 'needs_prescription'];
    const currentTab = availableTabs.find(tab => tab.id === activeTab);
    
    if (!currentTab) {
      for (const tabId of priorityOrder) {
        const tab = availableTabs.find(t => t.id === tabId);
        if (tab) {
          setActiveTab(tabId);
          break;
        }
      }
    }
  }, [availableTabs, activeTab]);

 
  // Get tab-specific summary
 const tabSummary = useMemo(() => getTabSummary(activeTab, segments), [activeTab, segments]);


  const totalItemCount = useMemo(
    () => segments.readyItemsCount + segments.prescriptionItemsCount + segments.pendingItemsCount + segments.rejectedItemsCount,
    [segments]
  );

  // Render loading state
  if (!isFetched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden flex items-center justify-center">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Premium loading spinner */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91] bg-clip-padding" style={{
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '4px'
            }}>
              <div className="absolute inset-0 rounded-full border-t-4 border-[#1ABA7F] animate-pulse" />
            </div>
            <ShoppingCart className="absolute inset-0 m-auto h-8 w-8 text-[#225F91]" />
          </div>

          {/* Loading text with shimmer effect */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
              Loading Your Cart
            </h2>
            <p className="text-gray-600 font-medium">Fetching your medications...</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render empty cart
  if (!cart?.pharmacies || cart.pharmacies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30">
        <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm py-3 px-3 sm:px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 h-10"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h2 className="text-lg sm:text-2xl font-bold text-[#225F91] tracking-tight text-center flex-1">
              Cart
            </h2>
            <div className="w-10" />
          </div>
        </nav>
        <EmptyCart />
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative p-1 overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" 
        aria-hidden="true" 
      />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <WifiOff className="h-5 w-5 animate-pulse" />
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md animate-ping" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="font-bold text-sm sm:text-base">No Internet Connection</span>
                <span className="hidden sm:inline text-white/80">•</span>
                <span className="text-xs sm:text-sm text-white/90">Changes will be saved when you're back online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`sticky ${!isOnline ? 'top-[52px]' : 'top-0'} z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b-2 border-[#1ABA7F]/10 py-4 px-4 sm:px-6 transition-all duration-300`}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="group h-12 px-4 border-2 border-[#1ABA7F]/20 hover:border-[#1ABA7F]/40 text-[#225F91] hover:bg-[#1ABA7F]/10 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="ml-2 hidden sm:inline font-semibold">Back</span>
          </Button>

          {/* Title with Icon */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="hidden sm:flex p-2 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-[#225F91]" />
            </div>
            <h2 className="text-base sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
              My Cart
            </h2>
          </div>

          {/* Actions Group */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefreshCart}
              disabled={isRefreshing || !isOnline}
              className="group relative h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:from-[#1ABA7F]/10 hover:to-[#225F91]/10 border-2 border-gray-200 hover:border-[#1ABA7F]/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              aria-label="Refresh cart"
            >
              {isRefreshing ? (
                <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-[#1ABA7F] animate-spin" />
              ) : (
                <RefreshCw className="absolute inset-0 m-auto h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] group-hover:rotate-180 transition-all duration-500" />
              )}
            </button>

            {/* Selection Mode Toggle */}
          {(segments.readyForCheckout.length + segments.needsPrescription.length + 
            segments.pendingPrescription.length + segments.rejectedPrescription.length) > 1 && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedItems(new Set());
              }}
              className={cn(
                "group relative h-12 px-4 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 shadow-sm hover:shadow-md",
                selectionMode 
                  ? "bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 text-red-700 hover:border-red-400"
                  : "bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
              )}
            >
              <span className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <X className="h-5 w-5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">Select Items</span>
                  </>
                )}
              </span>
            </button>
            )}

            {/* Cart Icon with Badge */}
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 border-2 border-[#1ABA7F]/30 flex items-center justify-center shadow-md">
                <ShoppingCart className="h-6 w-6 text-[#225F91]" aria-label="Shopping cart" />
              </div>
              {totalItemCount > 0 && (
                <div className="absolute -top-2 -right-2 min-w-[28px] h-7 px-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in duration-300">
                  <span className="text-xs font-black text-white">
                    {totalItemCount > 99 ? '99+' : totalItemCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8 px-2 sm:px-4">
        <ErrorMessage error={error} />
        
        <div className="max-w-6xl mx-auto lg:flex lg:gap-8">
          <div className="flex-1 min-w-0">
            <UnifiedRemoveDialog
              removeItem={removeItem}
              bulkRemoveItems={showBulkRemoveDialog ? bulkRemoveItems : null}
              onClose={() => {
                setRemoveItem(null);
                setShowBulkRemoveDialog(false);
                setBulkRemoveItems([]);
              }}
              onConfirm={showBulkRemoveDialog ? handleBulkRemoveConfirm : handleRemoveItem}
              isRemoving={showBulkRemoveDialog ? isBulkRemoving : (removeItem ? isUpdating[removeItem.id] : false)}
            />
            <QuantityUpdateDialog
              quantityUpdate={quantityUpdate}
              setQuantityUpdate={setQuantityUpdate}
              handleCheckout={handleCheckout}
            />

            {/* Tab Navigation */}
            {shouldShowTabs() && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-3 shadow-lg border-2 border-gray-200/50" role="tablist">
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    {availableTabs.map((tab, index) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          aria-controls={`${tab.id}-panel`}
                          className={`group relative flex flex-col sm:flex-row items-center justify-center gap-2 py-2 sm:py-4 px-2 sm:p-4 rounded-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2 ${
                            activeTab === tab.id
                              ? 'bg-white shadow-xl scale-105 border-2 border-[#1ABA7F]/40'
                              : 'hover:bg-white/60 hover:shadow-md border-2 border-transparent'
                          }`}
                          style={{
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          {/* Icon with background */}
                          <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                            activeTab === tab.id 
                              ? tab.color.replace('text-', 'bg-').replace('/10', '/20')
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <IconComponent className={`h-5 w-5 transition-all duration-300 ${
                              activeTab === tab.id 
                                ? tab.color.split(' ')[1]
                                : 'text-gray-500 group-hover:text-gray-700'
                            }`} />
                          </div>

                          {/* Label */}
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <span className={`text-xs sm:text-sm font-bold transition-colors duration-300 ${
                              activeTab === tab.id ? 'text-[#225F91]' : 'text-gray-600 group-hover:text-gray-900'
                            }`}>
                              <span className="hidden lg:inline">{tab.label}</span>
                              <span className="lg:hidden">{tab.shortLabel}</span>
                            </span>
                            
                            {/* Count badge */}
                            <div className={`px-2.5 py-1 rounded-full text-xs font-black shadow-sm transition-all duration-300 ${
                              activeTab === tab.id 
                                ? tab.color
                                : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                            }`}>
                              {tab.count}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab description */}
                <div className="mt-4 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-gray-50 border border-blue-200/80">
                  <p className="text-base text-gray-700 text-center font-medium">
                    {tabSummary.message}
                  </p>
                </div>
              </div>
            )}

            {/* Tab Content Panels */}
            <div className="space-y-8">
              {shouldShowTabs() ? (
                <>
                  {activeTab === 'ready' && readyPharmacies.length > 0 && (
                    <div role="tabpanel" id="ready-panel" className="space-y-6">
                      {readyPharmacies.map((pharmacy) => (
                        <PharmacyCartCard
                          key={pharmacy.pharmacy.id}
                          pharmacy={pharmacy}
                          handleQuantityChange={handleQuantityChange}
                          setRemoveItem={setRemoveItem}
                          isUpdating={isUpdating}
                          calculateItemPrice={calculateItemPrice}
                          segment="ready"
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                    </div>
                  )}

                  {activeTab === 'needs_prescription' && segments.needsPrescription.length > 0 && (
                    <div role="tabpanel" id="needs_prescription-panel" className="space-y-6">
                      {groupItemsByPharmacy(segments.needsPrescription).map((pharmacy) => (
                        <PharmacyCartCard
                          key={pharmacy.pharmacy.id}
                          pharmacy={pharmacy}
                          handleQuantityChange={handleQuantityChange}
                          setRemoveItem={setRemoveItem}
                          isUpdating={isUpdating}
                          calculateItemPrice={calculateItemPrice}
                          segment="needs_prescription"
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
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

                  {activeTab === 'pending' && segments.pendingPrescription.length > 0 && (
                    <div role="tabpanel" id="pending-panel" className="space-y-6">
                      {groupItemsByPharmacy(segments.pendingPrescription).map((pharmacy) => (
                        <PharmacyCartCard
                          key={pharmacy.pharmacy.id}
                          pharmacy={pharmacy}
                          handleQuantityChange={handleQuantityChange}
                          setRemoveItem={setRemoveItem}
                          isUpdating={isUpdating}
                          calculateItemPrice={calculateItemPrice}
                          segment="pending"
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                    </div>
                  )}

                  {activeTab === 'rejected' && segments.rejectedPrescription.length > 0 && (
                    <div role="tabpanel" id="rejected-panel" className="space-y-6">
                      {groupItemsByPharmacy(segments.rejectedPrescription).map((pharmacy) => (
                        <PharmacyCartCard
                          key={pharmacy.pharmacy.id}
                          pharmacy={pharmacy}
                          handleQuantityChange={handleQuantityChange}
                          setRemoveItem={setRemoveItem}
                          isUpdating={isUpdating}
                          calculateItemPrice={calculateItemPrice}
                          segment="rejected"
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
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
              ) : (
                <>
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
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                    </div>
                  )}

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
                          selectionMode={selectionMode}
                          isSelected={(itemId) => selectedItems.has(itemId)}
                          onToggleSelect={handleToggleSelect}
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

              <div>
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
      </main>

    <BulkRemoveActionBar
        selectedCount={selectedItems.size}
        onRemove={handleBulkRemove}
        onSelectAll={handleSelectAll}
        onClear={handleClearSelection}
        totalItems={totalItemCount}
        isRemoving={isBulkRemoving}
      />
    </div>
  );
}

// Export with Error Boundary
export default function Cart() {
  return (
    <CartErrorBoundary>
      <CartComponent />
    </CartErrorBoundary>
  );
}