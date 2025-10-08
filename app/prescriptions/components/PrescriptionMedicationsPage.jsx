'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useCart } from '@/hooks/useCart';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useGeoData } from '@/hooks/useGeoData';
import { usePrescriptionData } from '@/hooks/usePrescriptionData';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';

// UI Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HeroSection from './HeroSection';
import PrescriptionInfoCard from './PrescriptionInfoCard';
import PharmacyRecommendations from './PharmacyRecommendations';
import FilterControls from '@/components/search/FilterControls';
import LocationPrompt from '@/components/search/LocationPrompt';
import FloatingCartSummary from './FloatingCartSummary';
import CartDialog from '@/components/cart/CartDialog';
import DuplicateMedicationDialog from '@/components/cart/DuplicateMedicationDialog';
import BulkDuplicateDialog from '@/components/cart/BulkDuplicateDialog';
import UnifiedRemoveDialog from '@/components/cart/UnifiedRemoveDialog';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

// Utility functions
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (error) {
      console.error('localStorage.getItem error:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error('localStorage.setItem error:', error);
      return false;
    }
  }
};

const sanitizeUrlParam = (param) => {
  if (!param || typeof param !== 'string') return null;
  // Remove any potentially harmful characters
  return param.replace(/[^a-zA-Z0-9-_]/g, '');
};

const PrescriptionMedicationsPage = () => {
  // URL params with validation
  const { userIdentifier } = useParams();
  const searchParams = useSearchParams();
  const urlGuestId = sanitizeUrlParam(searchParams.get('guestId'));
  
  // Cart management
  const { cart, fetchCart, isInCart, guestId: cartGuestId } = useCart();
  const guestId = urlGuestId || cartGuestId;

  // Location and geo data
  const { 
    geoData, 
    states, 
    getLgas, 
    getWards, 
    reverseGeocode 
  } = useGeoData();
  
  const {
    userLocation,
    locationStatus,
    requestLocation,
  } = useLocationDetection();

  // Refs for stable references
  const refetchRef = useRef(null);
  const isInitialMount = useRef(true);
  const locationProcessingRef = useRef(false);

  // Filter state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  // Location processing state
  const [isLocationProcessed, setIsLocationProcessed] = useState(false);

  // UI state
  const [mounted, setMounted] = useState(false);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState([]);
  const [removeItemDialog, setRemoveItemDialog] = useState(null);

  // Derived filter options
  const lgas = useMemo(() => 
    filterState ? getLgas(filterState) : [],
    [filterState, getLgas]
  );

  const wards = useMemo(() => 
    filterState && filterLga ? getWards(filterState, filterLga) : [],
    [filterState, filterLga, getWards]
  );

  // Prescription data
  const {
    medications,
    prescriptionMetadata,
    pharmacyRecommendations,
    loading,
    error,
    refetch,
  } = usePrescriptionData({
    userIdentifier,
    guestId,
    userLocation,
    filterState,
    filterLga,
    filterWard,
    isLocationProcessed,
  });

  // Store refetch in ref for stable access
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Cart operations
  const {
    addToCart,
    bulkAddToCart,
    removeFromCart,
    bulkRemoveFromCart,
    isAddingToCart,
    isRemoving,
  } = useCartOperations(
    userIdentifier,
    guestId,
    prescriptionMetadata?.id,
    fetchCart
  );

  // Duplicate detection
  const {
    duplicateDialog,
    bulkDuplicateDialog,
    checkForDuplicates,
    checkBulkDuplicates,
    handleKeepExisting,
    handleReplaceWithNew,
    handleAddBoth,
    handleBulkKeepExisting,
    handleBulkReplaceAll,
    handleBulkAddAll,
    closeDuplicateDialog,
    closeBulkDialog,
  } = useDuplicateDetection({
    cart,
    isInCart,
    pharmacyRecommendations,
    medications,
    addToCart,
    bulkAddToCart,
    removeFromCart,
    bulkRemoveFromCart,
    onItemsAdded: (items) => {
      setLastAddedItems(items);
      setOpenCartDialog(true);
    },
  });

  // Mount detection
  useEffect(() => {
    setMounted(true);
    isInitialMount.current = false;
  }, []);

  // Sync URL guest ID to localStorage (only once on mount)
  useEffect(() => {
    if (urlGuestId && urlGuestId !== safeLocalStorage.getItem('guestId')) {
      safeLocalStorage.setItem('guestId', urlGuestId);
    }
  }, [urlGuestId]);

  // Stable debounced refetch using callback
  const triggerRefetch = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const debouncedRefetch = useDebounce(triggerRefetch, 300);

  // Auto-detect location from coordinates (one-time processing)
  useEffect(() => {
    if (!userLocation || !geoData?.length || isLocationProcessed || locationProcessingRef.current) {
      return;
    }

    locationProcessingRef.current = true;

    try {
      const match = reverseGeocode(userLocation.lat, userLocation.lng);
      
      if (match) {
        setFilterState(match.state);
        setFilterLga(match.lga);
        setFilterWard('');
        setIsLocationProcessed(true);
        
        // Trigger refetch after location is set
        setTimeout(() => {
          debouncedRefetch();
        }, 0);
      } else {
        console.error('Reverse geocoding failed:', { 
          lat: userLocation.lat, 
          lng: userLocation.lng 
        });
        toast.error('Unable to determine your location. Please select manually.');
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      toast.error('Error processing location. Please select manually.');
    } finally {
      locationProcessingRef.current = false;
    }
  }, [userLocation, geoData, reverseGeocode, isLocationProcessed, debouncedRefetch]);

  // Handle manual filter changes with debounced refetch
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }

    // Only refetch if filters are manually set (not from location auto-detection)
    if (!locationProcessingRef.current) {
      debouncedRefetch();
    }
  }, [filterState, filterLga, filterWard, debouncedRefetch]);

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && userIdentifier) {
      window.gtag('event', 'page_view', {
        page_title: 'Prescription Medications',
        page_path: `/prescriptions/${userIdentifier}`,
      });
    }
  }, [userIdentifier]);

  // Cart items for floating button
  const cartItems = useMemo(() => 
    cart?.pharmacies?.flatMap(p => p?.items || []) || [],
    [cart]
  );

  // Check if pharmacy data exists
  const hasPharmacyData = useMemo(() => {
    return pharmacyRecommendations?.length > 0 || 
           medications?.some(med => med.availability?.length > 0);
  }, [pharmacyRecommendations, medications]);

  // Show location prompt logic
  const shouldShowLocationPrompt = !hasPharmacyData && 
                                   locationStatus !== 'granted' &&
                                   !filterState && 
                                   !filterLga && 
                                   !filterWard;

  // Add to cart handler
  const handleAddToCart = useCallback(async (medicationId, pharmacyId, displayName) => {
    const hasDuplicate = checkForDuplicates(medicationId, pharmacyId, displayName);
    
    if (hasDuplicate) {
      return;
    }

    const medQuantity = medications?.find(m => m.id === medicationId)?.quantity || 1;
    
    try {
      const result = await addToCart(medicationId, pharmacyId, displayName, medQuantity);
      
      if (result?.orderItem) {
        const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
        
        setLastAddedItems([{
          id: result.orderItem.id,
          name: displayName,
          pharmacy: pharmacy?.pharmacyName || 'Unknown Pharmacy',
          quantity: result.orderItem.quantity || medQuantity,
        }]);
        
        setOpenCartDialog(true);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  }, [checkForDuplicates, medications, addToCart, pharmacyRecommendations]);

  // Bulk add handler
  const handleBulkAdd = useCallback(async (pharmacyId, meds) => {
    const { hasDuplicates, safeItems } = checkBulkDuplicates(pharmacyId, meds);
    
    if (hasDuplicates || safeItems.length === 0) {
      return;
    }

    const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
    const items = safeItems.map(med => ({
      medicationId: med.id,
      pharmacyId,
      quantity: medications?.find(m => m.id === med.id)?.quantity || 1,
    }));
    
    try {
      const result = await bulkAddToCart(items, pharmacy?.pharmacyName || 'pharmacy');
      
      if (result?.orderItems?.length) {
        setLastAddedItems(
          result.orderItems.map((orderItem, index) => ({
            id: orderItem.id,
            name: result.addedItems[index]?.displayName || 'Item',
            pharmacy: pharmacy?.pharmacyName || 'Unknown',
            quantity: orderItem.quantity,
          }))
        );
        setOpenCartDialog(true);
      }
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error('Failed to add items to cart. Please try again.');
    }
  }, [checkBulkDuplicates, pharmacyRecommendations, medications, bulkAddToCart]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSortBy('price');
    setIsLocationProcessed(false);
    locationProcessingRef.current = false;
    setShowFilters(false);
    
    // Trigger refetch after clearing
    setTimeout(() => {
      debouncedRefetch();
    }, 0);
  }, [debouncedRefetch]);

  // Handle location enable
  const handleEnableLocation = useCallback(async () => {
    // Clear existing filters and reset state
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setIsLocationProcessed(false);
    locationProcessingRef.current = false;
    
    try {
      await requestLocation();
      toast.success('Location enabled successfully');
    } catch (error) {
      const errorMessage = error?.code === 1 
        ? 'Location permission denied. Please enable in your browser settings.'
        : 'Unable to get your location. Please try again or select manually.';
      
      toast.error(errorMessage);
      console.error('Location error:', error);
    }
  }, [requestLocation]);

  // Handle manual location select
  const handleSelectLocation = useCallback(() => {
    setShowFilters(true);
    
    setTimeout(() => {
      const filterElement = document.querySelector('[data-filters]');
      if (filterElement) {
        filterElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 200);
  }, []);

  // Handle remove item confirmation
  const handleRemoveConfirm = useCallback(async () => {
    if (!removeItemDialog?.id) return;
    
    try {
      await removeFromCart(removeItemDialog.id);
      setRemoveItemDialog(null);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item. Please try again.');
    }
  }, [removeItemDialog, removeFromCart]);

  // SSR guard
  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen p-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F]/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#225F91]/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <main className="py-8 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto lg:flex lg:gap-8">
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <HeroSection
              userName={null}
              prescriptionMetadata={prescriptionMetadata}
              medications={medications}
            />
            
            {/* Prescription Info Card */}
            <div className="px-2">
              <PrescriptionInfoCard
                prescriptionMetadata={prescriptionMetadata}
                medications={medications}
              />
            </div>
            
            <hr className="border-t border-gray-300 my-4 sm:my-6" />

            {medications?.length > 0 && (
              <>
                {/* Filter Controls */}
                <div className="my-6 px-2" data-filters>
                  <FilterControls
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    filterState={filterState}
                    setFilterState={setFilterState}
                    filterLga={filterLga}
                    setFilterLga={setFilterLga}
                    filterWard={filterWard}
                    setFilterWard={setFilterWard}
                    states={states}
                    lgas={lgas}
                    wards={wards}
                    clearFilters={clearFilters}
                  />
                </div>
                
                <hr className="border-t border-gray-300 mb-8" />

                {/* Location Prompt or Pharmacy Results */}
                {shouldShowLocationPrompt ? (
                  <div className="px-2 mb-8">
                    <LocationPrompt
                      onSelectLocation={handleSelectLocation}
                      onEnableLocation={handleEnableLocation}
                      locationStatus={locationStatus}
                    />
                  </div>
                ) : !hasPharmacyData ? (
                  <div className="px-2 mb-8">
                    <Card className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-12">
                      <div className="text-center">
                        <h3 className="text-2xl font-black text-gray-700 mb-2">
                          No pharmacies found
                        </h3>
                        <p className="text-gray-600 font-medium mb-4">
                          {filterState || filterLga || filterWard 
                            ? 'Try adjusting your location filters'
                            : 'Please select your location to see available pharmacies'
                          }
                        </p>
                        {(filterState || filterLga || filterWard) && (
                          <Button
                            onClick={clearFilters}
                            className="mt-4 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white rounded-xl px-6 py-2 font-bold hover:opacity-90 transition-opacity"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                ) : (
                  <PharmacyRecommendations
                    pharmacyRecommendations={pharmacyRecommendations}
                    medications={medications}
                    handleAddToCart={handleAddToCart}
                    handleBulkAddWithDuplicateCheck={handleBulkAdd}
                    cart={cart}
                    isInCart={isInCart}
                    isAddingToCart={isAddingToCart}
                    onRemoveItem={(item) => setRemoveItemDialog(item)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <FloatingCartSummary
          cartItemsCount={cartItems.length}
          onViewCart={() => window.location.href = '/cart'}
        />
      )}

      {/* Dialogs */}
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItems={lastAddedItems}
        onRemoveItems={bulkRemoveFromCart}
        isRemoving={isRemoving}
      />

      <DuplicateMedicationDialog
        isOpen={duplicateDialog.isOpen}
        onClose={closeDuplicateDialog}
        existingItem={duplicateDialog.existingItem}
        newItem={duplicateDialog.newItem}
        onKeepExisting={handleKeepExisting}
        onReplaceWithNew={handleReplaceWithNew}
        onAddBoth={handleAddBoth}
      />

      <BulkDuplicateDialog
        isOpen={bulkDuplicateDialog.isOpen}
        onClose={closeBulkDialog}
        pharmacyName={bulkDuplicateDialog.pharmacyName}
        duplicates={bulkDuplicateDialog.duplicates}
        safeItems={bulkDuplicateDialog.safeItems}
        safeItemsCount={bulkDuplicateDialog.safeItems.length}
        medications={medications}
        onKeepExisting={handleBulkKeepExisting}
        onReplaceAll={handleBulkReplaceAll}
        onAddAll={handleBulkAddAll}
        isProcessing={bulkDuplicateDialog.isProcessing}
      />

      <UnifiedRemoveDialog
        removeItem={removeItemDialog}
        bulkRemoveItems={null}
        onClose={() => setRemoveItemDialog(null)}
        onConfirm={handleRemoveConfirm}
        isRemoving={isRemoving}
      />

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-6">
        <div className="text-center">
          <p className="text-sm opacity-90">
            &copy; {new Date().getFullYear()} Manzu. Powered by WellRica.
          </p>
        </div>
      </footer>
    </div>
  );
};

PrescriptionMedicationsPage.displayName = 'PrescriptionMedicationsPage';

export default PrescriptionMedicationsPage;