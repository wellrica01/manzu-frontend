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
    reverseGeocode 
  } = useGeoData();
  
const {
  userLocation,
  locationStatus,
  progress,        
  error: locationError, 
  requestLocation,
  requestPreciseLocation,
  cancelLocationRequest, 
} = useLocationDetection();

  // Refs
  const refetchRef = useRef(null);
  const isInitialMount = useRef(true);
  const locationProcessingRef = useRef(false);

  const lastProcessedLocation = useRef(null);
  const locationTimeoutRef = useRef(null);



  // Filter state 
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [isLocationProcessed, setIsLocationProcessed] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);


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


  // ✅ UPDATED: Auto-detect location - sets only state filter
useEffect(() => {
  if (!userLocation || !geoData?.length || isLocationProcessed || locationProcessingRef.current || filtersCleared) {
    return;
  }

  // ✅ FIX 1: Prevent duplicate processing with proper coordinate names
const locationKey = `${userLocation.latitude?.toFixed(4) || userLocation.lat?.toFixed(4)},${userLocation.longitude?.toFixed(4) || userLocation.lng?.toFixed(4)}`;
  
  if (lastProcessedLocation.current === locationKey) {
    console.log('⭐️ Location already processed, skipping');
    setIsLoadingLocation(false);
    return;
  }
  
  console.log('🔄 Processing new location:', locationKey);
  lastProcessedLocation.current = locationKey;
  locationProcessingRef.current = true;

  try {
    // ✅ FIX 2: Handle both coordinate naming conventions
      const lat = userLocation.latitude || userLocation.lat;
      const lng = userLocation.longitude || userLocation.lng;

      if (!lat || !lng) {
        console.error('Invalid location coordinates:', userLocation);
        setIsLoadingLocation(false);
        locationProcessingRef.current = false;
        return;
      }

      const match = reverseGeocode(lat, lng, {
        includeNearby: true
      });
    
    console.log('Reverse geocode match:', match);
    
    if (match) {
      // ✅ ONLY set state, leave LGA empty for manual selection
      setFilterState(match.state);
      setIsLocationProcessed(true);
      
      // Show appropriate message based on confidence
      if (match.confidence.level === 'high' || match.confidence.level === 'good') {
        toast.success(
          `📍 Location detected: ${match.state}`,
          { 
            description: `Nearest LGA: ${match.lga} (${match.distance.toFixed(1)}km away). Select your LGA from the filters if needed.`,
            duration: 5000,
            action: {
              label: 'Select LGA',
              onClick: () => setShowFilters(true)
            }
          }
        );
      } else {
        // Low confidence - encourage manual selection
        toast.warning(
          `📍 Approximate location: ${match.state}`,
          {
            description: `${match.distance.toFixed(1)}km from ${match.lga}. Please select your LGA manually for accurate results.`,
            duration: 7000,
            action: {
              label: 'Select LGA',
              onClick: () => setShowFilters(true)
            }
          }
        );
        
        // Auto-open filters for low confidence
        setTimeout(() => setShowFilters(true), 1000);
      }
      
      // ✅ FIX 3: Only refetch after state is set
      setTimeout(() => {
        debouncedRefetch();
        setIsLoadingLocation(false);
      }, 0);
    } else {
      // ✅ No match found - guide user to manual selection
      toast.error('Could not determine your location', {
        description: 'Please select your state and local government area manually.',
        duration: 6000,
        action: {
          label: 'Select Manually',
          onClick: () => setShowFilters(true)
        }
      });
      setIsLoadingLocation(false);
      setShowFilters(true);
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    toast.error('Error processing location. Please select manually.', {
      duration: 5000,
      action: {
        label: 'Select Location',
        onClick: () => setShowFilters(true)
      }
    });
    setIsLoadingLocation(false);
    setShowFilters(true);
  } finally {
    locationProcessingRef.current = false;
  }
}, [userLocation, geoData, reverseGeocode, isLocationProcessed, debouncedRefetch, filtersCleared, setShowFilters]);




  // ✅ UPDATED: Handle filter changes - removed filterWard
  useEffect(() => {
    if (isInitialMount.current) return;

    if (!locationProcessingRef.current) {
      debouncedRefetch();
    }
  }, [filterState, filterLga, debouncedRefetch]);

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

  // ✅ UPDATED: shouldShowLocationPrompt - removed filterWard
  const shouldShowLocationPrompt = !hasPharmacyData && 
                                   !filterState && 
                                   !filterLga;

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

  // ✅ UPDATED: clearFilters 
  const clearFilters = useCallback(() => {
    setFilterState('');
    setFilterLga('');
    setSortBy('price');
    setShowFilters(false);
    setIsLocationProcessed(false);
    setFiltersCleared(true);
    debouncedRefetch();
    lastProcessedLocation.current = null;
  }, [debouncedRefetch]);

  // ✅ UPDATED: handleEnableLocation 
const handleEnableLocation = useCallback(async () => {
  // Check browser support
  if (!navigator.geolocation) {
    toast.error('GPS not supported', {
      description: 'Your browser does not support location services. Please select your location manually.',
      duration: 6000,
    });
    setShowFilters(true);
    return;
  }

  // Check permission state upfront
  const checkPermissionState = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      } catch (error) {
        console.warn('Permission API not supported:', error);
        return 'prompt';
      }
    }
    return 'prompt';
  };

  const permissionState = await checkPermissionState();
  
  if (permissionState === 'denied') {
    setPermissionDenied(true);
    toast.error('Location access blocked', {
      description: '🔒 Please enable location in your browser settings.',
      duration: 8000,
      action: {
        label: 'How to enable',
        onClick: () => {
          window.open('https://support.google.com/chrome/answer/142065', '_blank');
        },
      },
    });
    return;
  }

  // Reset states
  setFilterState('');
  setFilterLga('');
  setIsLocationProcessed(false);
  setFiltersCleared(false);
  setIsLoadingLocation(true);
  setPermissionDenied(false);
  locationProcessingRef.current = false;
  lastProcessedLocation.current = null;
  
  // ⚡ Set safety timeout (45 seconds - more generous)
  locationTimeoutRef.current = setTimeout(() => {
    setIsLoadingLocation(false);
    toast.error('Location Detection Timeout', {
      description: 'This is taking longer than expected. You can select your area manually instead.',
      duration: 6000,
      action: {
        label: 'Select Manually',
        onClick: () => setShowFilters(true),
      },
    });
  }, 45000);
  
  try {
    const location = await requestLocation();
    
    // Clear timeout on success
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    console.log('✅ Location success:', location);
    
    // 🎯 Success feedback based on accuracy
    if (location.accuracy <= 100) {
      toast.success('📍 Precise Location Found!', {
        description: `Accuracy: ~${location.accuracy}m - Showing pharmacies near you`,
        duration: 3000,
      });
    } else if (location.accuracy <= 500) {
      toast.success('📍 Location Found!', {
        description: `Accuracy: ~${location.accuracy}m - Showing nearby pharmacies`,
        duration: 3000,
      });
    } else {
      toast.success('📍 Approximate Location Found', {
        description: `Accuracy: ~${location.accuracy}m - Showing pharmacies in your area`,
        duration: 4000,
        action: {
          label: 'Refine',
          onClick: async () => {
            setIsLoadingLocation(true);
            try {
              const betterLocation = await requestPreciseLocation();
              toast.success('✨ Location Refined!', {
                description: `Improved to ~${betterLocation.accuracy}m accuracy`,
                duration: 2000,
              });
            } catch (err) {
              console.warn('Refinement failed:', err);
              toast.error('Refinement Failed', {
                description: 'Using your original location instead.',
                duration: 3000,
              });
            } finally {
              setIsLoadingLocation(false);
            }
          },
        },
      });
    }
    
  } catch (error) {
    // Clear timeout on error
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    console.error('❌ Location error:', error);
    
    const errorMessage = error?.message || '';
    
    // Don't show error for user cancellation
    if (errorMessage === 'Location request cancelled') {
      toast.info('Location Request Cancelled', {
        duration: 2000,
      });
      setIsLoadingLocation(false);
      return;
    }
    
    // 🎯 User-friendly error handling
    if (error.code === 1) {
      // Permission denied
      setPermissionDenied(true);
      toast.error('Location Access Blocked', {
        description: error.details || '🔒 Please allow location access in your browser to see nearby pharmacies.',
        duration: 8000,
        action: {
          label: 'How to Fix',
          onClick: () => {
            window.open('https://support.google.com/chrome/answer/142065', '_blank');
          },
        },
      });
      setIsLoadingLocation(false);
      
    } else if (error.code === 2) {
      // Position unavailable
      toast.error('Location Unavailable', {
        description: error.details || 'Your device cannot determine your location. This may be due to poor GPS signal or disabled location services.',
        duration: 7000,
        action: {
          label: 'Select Area',
          onClick: () => {
            setShowFilters(true);
            setIsLoadingLocation(false);
          },
        },
      });
      
      // Auto-open filters after a delay
      setTimeout(() => {
        setIsLoadingLocation(false);
        setShowFilters(true);
      }, 2000);
      
    } else if (error.code === 3) {
      // Timeout
      toast.error('Location Timeout', {
        description: error.details || 'Finding your location took too long. This often happens indoors or in areas with poor GPS signal.',
        duration: 7000,
        action: {
          label: 'Select Area',
          onClick: () => {
            setShowFilters(true);
            setIsLoadingLocation(false);
          },
        },
      });
      
      // Auto-open filters after a delay
      setTimeout(() => {
        setIsLoadingLocation(false);
        setShowFilters(true);
      }, 2000);
      
    } else {
      // Generic error
      toast.error('Couldn\'t Detect Location', {
        description: error.details || 'No worries! You can select your area manually to find nearby pharmacies.',
        duration: 6000,
        action: {
          label: 'Select Area',
          onClick: () => {
            setShowFilters(true);
            setIsLoadingLocation(false);
          },
        },
      });
      
      // Auto-open filters after a delay
      setTimeout(() => {
        setIsLoadingLocation(false);
        setShowFilters(true);
      }, 2000);
    }
  }
}, [requestLocation, requestPreciseLocation, setShowFilters]);



const handleCancelLocation = useCallback(() => {
  cancelLocationRequest();
  setIsLoadingLocation(false);
  
  if (locationTimeoutRef.current) {
    clearTimeout(locationTimeoutRef.current);
  }

  // Reset location tracking on cancel
  lastProcessedLocation.current = null;
  
  toast.info('Location Detection Cancelled', {
    description: 'You can try again or select your area manually.',
    duration: 3000,
    action: {
      label: 'Select Manually',
      onClick: () => setShowFilters(true),
    },
  });
}, [cancelLocationRequest, setShowFilters]);



// ✅ FIX 5: Cleanup timeout on unmount
useEffect(() => {
  return () => {
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
  };
}, []);


  // ✅ UPDATED: handleSelectLocation - removed ward
  const handleSelectLocation = useCallback(() => {
    setFilterState('');
    setFilterLga('');
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
              {/* ✅ UPDATED: FilterControls - removed ward props */}
              <FilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filterState={filterState}
                setFilterState={setFilterState}
                filterLga={filterLga}
                setFilterLga={setFilterLga}
                states={states}
                lgas={lgas}
                clearFilters={clearFilters}
              />
            </div>
            
            <div className="h-px bg-gray-200 mb-8" />

            {shouldShowLocationPrompt ? (
              <div className="mb-8">
                <LocationPrompt
                  onSelectLocation={handleSelectLocation}
                  onEnableLocation={handleEnableLocation}
                  onCancelLocation={handleCancelLocation}
                  locationStatus={locationStatus}
                  isLoadingLocation={isLoadingLocation}
                  permissionDenied={permissionDenied}     
                  progress={progress}                    
                  error={locationError}         
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
                {/* ✅ UPDATED: Location display - removed ward */}
                {(filterState || filterLga) && (
                  <div className="mt-4 p-3 rounded-xl bg-white border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      Location: {filterState}{filterLga ? `, ${filterLga}` : ''}
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