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
import { MapPin } from 'lucide-react';
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
  return param.replace(/[^a-zA-Z0-9-_]/g, '');
};

const PrescriptionMedicationsPage = () => {
  // URL params
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

  // Refs
  const refetchRef = useRef(null);
  const isInitialMount = useRef(true);
  const locationProcessingRef = useRef(false);

  // Filter state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [isLocationProcessed, setIsLocationProcessed] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (urlGuestId && urlGuestId !== safeLocalStorage.getItem('guestId')) {
      safeLocalStorage.setItem('guestId', urlGuestId);
    }
  }, [urlGuestId]);

  const triggerRefetch = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const debouncedRefetch = useDebounce(triggerRefetch, 300);


// Auto-detect location
  useEffect(() => {
    if (!userLocation || !geoData?.length || isLocationProcessed || locationProcessingRef.current || filtersCleared) {
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
        
        setTimeout(() => {
          debouncedRefetch();
          setIsLoadingLocation(false);
        }, 0);
      } else {
        toast.error('Unable to determine your location. Please select manually.');
        setIsLoadingLocation(false);
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      toast.error('Error processing location. Please select manually.');
      setIsLoadingLocation(false);
    } finally {
      locationProcessingRef.current = false;
    }
  }, [userLocation, geoData, reverseGeocode, isLocationProcessed, debouncedRefetch, filtersCleared]);

  // Handle filter changes
  useEffect(() => {
    if (isInitialMount.current) return;

    if (!locationProcessingRef.current) {
      debouncedRefetch();
    }
  }, [filterState, filterLga, filterWard, debouncedRefetch]);

  // Analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && userIdentifier) {
      window.gtag('event', 'page_view', {
        page_title: 'Prescription Medications',
        page_path: `/prescriptions/${userIdentifier}`,
      });
    }
  }, [userIdentifier]);

  const cartItems = useMemo(() => 
    cart?.pharmacies?.flatMap(p => p?.items || []) || [],
    [cart]
  );

  const hasPharmacyData = useMemo(() => {
    return pharmacyRecommendations?.length > 0 || 
           medications?.some(med => med.availability?.length > 0);
  }, [pharmacyRecommendations, medications]);

  const shouldShowLocationPrompt = !hasPharmacyData && 
                                   !filterState && 
                                   !filterLga && 
                                   !filterWard;

  const handleAddToCart = useCallback(async (medicationId, pharmacyId, displayName) => {
    const hasDuplicate = checkForDuplicates(medicationId, pharmacyId, displayName);
    
    if (hasDuplicate) return;

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
      toast.error('Failed to add item to cart');
    }
  }, [checkForDuplicates, medications, addToCart, pharmacyRecommendations]);

  const handleBulkAdd = useCallback(async (pharmacyId, meds) => {
    const { hasDuplicates, safeItems } = checkBulkDuplicates(pharmacyId, meds);
    
    if (hasDuplicates || safeItems.length === 0) return;

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
      toast.error('Failed to add items to cart');
    }
  }, [checkBulkDuplicates, pharmacyRecommendations, medications, bulkAddToCart]);

  const clearFilters = useCallback(() => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSortBy('price');
    setShowFilters(false);
    setIsLocationProcessed(false);
    setFiltersCleared(true);
    debouncedRefetch();
  }, [debouncedRefetch]);

  const handleEnableLocation = useCallback(async () => {
      setFilterState('');
      setFilterLga('');
      setFilterWard('');
      setIsLocationProcessed(false);
      setFiltersCleared(false);
      setIsLoadingLocation(true);
      locationProcessingRef.current = false;
      
      try {
        await requestLocation();
        toast.success('Location detected successfully');
      } catch (error) {
        const errorMessage = error?.code === 1 
          ? 'Location permission denied'
          : 'Unable to get location';
        
        toast.error(errorMessage);
        setIsLoadingLocation(false);
      }
    }, [requestLocation]);

  const handleSelectLocation = useCallback(() => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setShowFilters(true);
    setTimeout(() => {
      const filterElement = document.querySelector('[data-filters]');
      if (filterElement) {
        filterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    if (!removeItemDialog?.id) return;
    
    try {
      await removeFromCart(removeItemDialog.id);
      setRemoveItemDialog(null);
      toast.success('Item removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove item');
    }
  }, [removeItemDialog, removeFromCart]);

  if (!mounted) return null;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8 px-4 max-w-6xl mx-auto">
        <HeroSection
          userName={null}
          prescriptionMetadata={prescriptionMetadata}
          medications={medications}
        />
        
        <PrescriptionInfoCard
          prescriptionMetadata={prescriptionMetadata}
          medications={medications}
        />
        
        <div className="h-px bg-gray-200 my-8" />

        {medications?.length > 0 && (
          <>
            <div className="mb-8" data-filters>
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
            
            <div className="h-px bg-gray-200 mb-8" />

            {shouldShowLocationPrompt ? (
              <div className="mb-8">
                <LocationPrompt
                  onSelectLocation={handleSelectLocation}
                  onEnableLocation={handleEnableLocation}
                  locationStatus={locationStatus}
                  isLoadingLocation={isLoadingLocation}
                />
              </div>
            ) : !hasPharmacyData ? (
              <div className="text-center p-12 bg-gray-50 rounded-2xl border-2 border-gray-200">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-gray-400" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No pharmacies found
                </h3>
                <p className="text-gray-600 mb-4">
                  No pharmacies in your selected location
                </p>
                {(filterState || filterLga || filterWard) && (
                  <div className="mt-4 p-3 rounded-xl bg-white border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      Location: {filterState}{filterLga ? `, ${filterLga}` : ''}{filterWard ? `, ${filterWard}` : ''}
                    </p>
                  </div>
                )}
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
      </main>

      {cartItems.length > 0 && (
        <FloatingCartSummary
          cartItemsCount={cartItems.length}
          onViewCart={() => window.location.href = '/cart'}
        />
      )}

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

      <footer className="bg-[#225F91] text-white py-6 px-4 mt-12">
        <div className="text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Manzu. Powered by WellRica.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrescriptionMedicationsPage;