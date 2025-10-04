'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2, ShoppingCart, Pill, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import PharmacyRecommendations from './PharmacyRecommendations';
import HeroSection from './HeroSection';
import PrescriptionInfoCard from './PrescriptionInfoCard';
import CartDialog from '@/components/cart/CartDialog';
import DuplicateMedicationDialog from '@/components/cart/DuplicateMedicationDialog';
import BulkDuplicateDialog from '@/components/cart/BulkDuplicateDialog';
import UnifiedRemoveDialog from '@/components/cart/UnifiedRemoveDialog';
import { bulkRemoveCartItems } from '@/components/cart/cartApi';
import { useCart } from '@/hooks/useCart';
import FilterControls from '@/components/search/FilterControls';



const FloatingCartSummary = ({ cartItemsCount, onViewCart }) => {
  if (cartItemsCount === 0) return null;
  return (
  <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-50 animate-pulse" />
      <Button 
          onClick={onViewCart}
          className="relative h-16 px-10 rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-white">
        <ShoppingCart className="h-6 w-6 mr-3" strokeWidth={3} />
        Go to Cart ({cartItemsCount})
      </Button>
    </div>
  </div>
  );
};

const PrescriptionMedicationsPage = React.memo(() => {
  const [medications, setMedications] = useState([]);
  const [defaultMedications, setDefaultMedications] = useState([]);
  const [prescriptionMetadata, setPrescriptionMetadata] = useState(null);
  const [pharmacyRecommendations, setPharmacyRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const { userIdentifier } = useParams();
  const { cart, fetchCart, isInCart, guestId } = useCart();
  const cartItems = cart?.pharmacies?.flatMap(p => p.items) || [];
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  const [removeItemDialog, setRemoveItemDialog] = useState(null);

  const [duplicateDialog, setDuplicateDialog] = useState({
  isOpen: false,
  existingItem: null,
  newItem: null
    });

  const [bulkDuplicateDialog, setBulkDuplicateDialog] = useState({
    isOpen: false,
    pharmacyName: '',
    duplicates: [],
    safeItems: [],
    pharmacyId: null
  });


  // Filtering state for pharmacies
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);
  const [geoData, setGeoData] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');

  // Load geo data and states on mount
  useEffect(() => {
    fetch('/data/full.json')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setStates(data.map(state => ({ value: state.state, label: state.state })));
      })
      .catch(err => {
        console.error('Failed to load geo data:', err);
        toast.error('Failed to load location data', { duration: 4000 });
      });
  }, []);

  // Attempt to fetch geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.info('Unable to fetch location. Showing all pharmacies.', { duration: 4000 });
          setUserLocation(null);
        }
      );
    } else {
      toast.info('Geolocation not supported. Showing all pharmacies.', { duration: 4000 });
      setUserLocation(null);
    }
  }, []);

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function reverseGeocode(userLat, userLng, geoData) {
    let nearest = null;
    let minDistance = Infinity;
    geoData.forEach((state) => {
      state.lgas.forEach((lga) => {
        const lgaCoords = lga.wards.map(w => [w.latitude, w.longitude]);
        const avgLat = lgaCoords.reduce((sum, [lat]) => sum + lat, 0) / lgaCoords.length;
        const avgLng = lgaCoords.reduce((sum, [, lng]) => sum + lng, 0) / lgaCoords.length;
        const dist = haversineDistance(userLat, userLng, avgLat, avgLng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { state: state.state, lga: lga.name, distance: dist };
        }
      });
    });
    return nearest;
  }

  useEffect(() => {
    if (userLocation && geoData) {
      const match = reverseGeocode(userLocation.lat, userLocation.lng, geoData);
      if (match) {
        setFilterState(match.state);
        updateLgas(match.state);
        setFilterLga(match.lga);
        updateWards(match.state, match.lga);
        setFilterWard('');
      }
    }
  }, [userLocation, geoData]);

  const updateLgas = useCallback((state) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData ? stateData.lgas.map(lga => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  }, [geoData]);

  const updateWards = useCallback((state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  }, [geoData]);

  useEffect(() => {
    const noFilters = !filterState && !filterLga && !filterWard;
    if (noFilters) {
      setMedications(defaultMedications);
    }
  }, [filterState, filterLga, filterWard, defaultMedications]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Prescription Medications',
        page_path: `/prescriptions/${userIdentifier}`,
      });
    }
  }, [userIdentifier]);

const fetchPrescriptionOrder = useCallback(async () => {
  try {
    const queryParams = new URLSearchParams();
    if (userLocation) {
      queryParams.append('lat', userLocation.lat);
      queryParams.append('lng', userLocation.lng);
      queryParams.append('radius', '10');
    }
    if (filterState) queryParams.append('state', filterState);
    if (filterLga) queryParams.append('lga', filterLga);
    if (filterWard) queryParams.append('ward', filterWard);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/${userIdentifier}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: { 'x-guest-id': guestId },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch prescription order');
    }
    const data = await response.json();
    setMedications(data.medications || []);
    setDefaultMedications(data.medications || []);
    setPrescriptionMetadata(data.prescriptionMetadata || null);
    setPharmacyRecommendations(data.pharmacyRecommendations || []); // Add this
  } catch (err) {
    setError(err.message || 'Failed to load prescription');
    toast.error(err.message || 'Failed to load prescription', { duration: 4000 });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'error', {
        error_message: err.message,
        page: 'Prescription Medications',
      });
    }
  } finally {
    setLoading(false);
  }
}, [userIdentifier, userLocation, guestId, filterState, filterLga, filterWard]);

  useEffect(() => {
    if (userIdentifier) {
      fetchPrescriptionOrder();
    }
  }, [userIdentifier, userLocation, fetchPrescriptionOrder, filterState, filterLga, filterWard]);


const addToCartInternal = async (medicationId, pharmacyId, displayName, quantity = 1) => {
  setIsAddingToCart(prev => ({ ...prev, [`${medicationId}-${pharmacyId}`]: true }));
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId,
      },
      body: JSON.stringify({
        userIdentifier,
        medicationId,
        pharmacyId,
        quantity,
        prescriptionId: prescriptionMetadata?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to cart');
    }

    const result = await response.json();
    await fetchCart();


   const pharmacy = pharmacyRecommendations.find(p => p.pharmacyId === pharmacyId);
   setLastAddedItems([{
     id: result.orderItem.id,
     name: quantity > 1 ? `${displayName} x${quantity}` : displayName,
     pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
     quantity: result.orderItem.quantity
   }]);

    setOpenCartDialog(true);
    toast.success(`${displayName} added to cart`);
  } catch (error) {
    console.error('Add to cart error:', error);
    toast.error(error.message || 'Failed to add to cart');
  } finally {
    setIsAddingToCart(prev => ({ ...prev, [`${medicationId}-${pharmacyId}`]: false }));
  }
};


const handleAddToCart = async (medicationId, pharmacyId, displayName) => {
  // Check if medication exists in another pharmacy
  const existingInCart = cart?.pharmacies?.find(pharmacy => 
    pharmacy.items?.some(item => item.medication.id === medicationId && pharmacy.pharmacy.id !== pharmacyId)
  );

  if (existingInCart) {
    const existingItem = existingInCart.items.find(item => item.medication.id === medicationId);
    const newPharmacy = pharmacyRecommendations.find(p => p.pharmacyId === pharmacyId);
    const newMed = newPharmacy?.meds.find(m => m.id === medicationId);

    setDuplicateDialog({
      isOpen: true,
      existingItem: {
        medicationName: displayName,
        pharmacyName: existingInCart.pharmacy.name,
        price: existingItem.price,
        quantity: existingItem.quantity,
        cartItemId: existingItem.id,
        pharmacyId: existingInCart.pharmacy.id
      },
      newItem: {
        medicationName: displayName,
        pharmacyName: newPharmacy.pharmacyName,
        price: newMed.price,
        quantity: medications.find(m => m.id === medicationId)?.quantity || 1,
        medicationId,
        pharmacyId
      }
    });
    return; // Stop here
  }

  // If no duplicates, just add normally
  await addToCartInternal(medicationId, pharmacyId, displayName, medications.find(m => m.id === medicationId)?.quantity || 1);
};


const handleKeepExisting = () => {
  toast.info('Keeping your current selection');
  setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
};


const handleReplaceWithNew = async () => {
  const { existingItem, newItem } = duplicateDialog;
  try {
    // Remove the existing item
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${existingItem.cartItemId}`, {
      method: 'DELETE',
      headers: { 'x-guest-id': guestId },
    });
    await fetchCart(); // make sure cart is updated

    // Directly add new item without duplicate check
    await addToCartInternal(newItem.medicationId, newItem.pharmacyId, newItem.medicationName, newItem.quantity);

    toast.success(`Switched to ${newItem.pharmacyName}`);
    setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
  } catch (error) {
    console.error(error);
    toast.error(error.message || 'Failed to replace item');
  }
};

const handleAddBoth = async () => {
  const { newItem } = duplicateDialog;
  try {
    // Directly add the new item without duplicate check
    await addToCartInternal(newItem.medicationId, newItem.pharmacyId, newItem.medicationName, newItem.quantity);

    toast.info('Added from both pharmacies');
    setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
  } catch (error) {
    console.error(error);
    toast.error('Failed to add both items');
  }
};


// Handle bulk add with duplicate detection
const handleBulkAddWithDuplicateCheck = async (pharmacyId, meds) => {
  // Check each medication for duplicates in OTHER pharmacies
  const duplicates = [];
  const safeToAdd = [];

  meds.forEach(med => {
    // Skip if already in cart from THIS pharmacy
    if (isInCart(med.id, pharmacyId)) {
      return;
    }

    // Check if exists in a DIFFERENT pharmacy
    const existingInCart = cart?.pharmacies?.find(pharmacy => 
      pharmacy.items?.some(item => item.medication.id === med.id && pharmacy.pharmacy.id !== pharmacyId)
    );

    if (existingInCart) {
      const existingItem = existingInCart.items.find(item => item.medication.id === med.id);
      duplicates.push({
        medicationId: med.id,
        medicationName: med.displayName,
        currentPharmacy: existingInCart.pharmacy.name,
        currentPrice: existingItem.price,
        newPrice: med.price,
        quantity: existingItem.quantity,
        cartItemId: existingItem.id,
        currentPharmacyId: existingInCart.pharmacy.id
      });
    } else {
      safeToAdd.push(med);
    }
  });

  // If there are duplicates, show dialog with options
  if (duplicates.length > 0) {
    const currentPharmacy = pharmacyRecommendations.find(p => p.pharmacyId === pharmacyId);
    
    setBulkDuplicateDialog({
      isOpen: true,
      pharmacyName: currentPharmacy?.pharmacyName || 'this pharmacy',
      duplicates,
      safeItems: safeToAdd,
      pharmacyId
    });
    return null; // Signal duplicates found
  }

  // If no duplicates, proceed
  return { pharmacyId, meds: safeToAdd };
};


// Handle bulk duplicate dialog actions
const handleBulkKeepExisting = () => {
  // Just add the safe items (skip duplicates)
  const { safeItems, pharmacyId } = bulkDuplicateDialog;
  setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
  
  if (safeItems.length > 0) {
    toast.info(`Adding ${safeItems.length} non-duplicate item${safeItems.length > 1 ? 's' : ''}`);
    // Trigger the actual bulk add for safe items only
    return { pharmacyId, meds: safeItems };
  } else {
    toast.info('No items to add');
  }
};

const handleBulkReplaceAll = async () => {
  const { duplicates, safeItems, pharmacyId } = bulkDuplicateDialog;
  
  try {
    // Remove all duplicate items from cart
    for (const dup of duplicates) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${dup.cartItemId}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
    }
    
    await fetchCart();
    
    // Now add all items (both previously duplicates and safe items)
    const allMeds = [
      ...duplicates.map(d => pharmacyRecommendations
        .find(p => p.pharmacyId === pharmacyId)?.meds
        .find(m => m.id === d.medicationId)
      ),
      ...safeItems
    ].filter(Boolean);
    
    setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
    toast.success(`Replacing ${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''}`);
    
    return { pharmacyId, meds: allMeds };
  } catch (error) {
    console.error(error);
    toast.error('Failed to replace items');
  }
};

const handleBulkAddAll = () => {
  // Add everything (keep existing + add new from this pharmacy)
  const { duplicates, safeItems, pharmacyId } = bulkDuplicateDialog;
  
  const allMeds = [
    ...duplicates.map(d => pharmacyRecommendations
      .find(p => p.pharmacyId === pharmacyId)?.meds
      .find(m => m.id === d.medicationId)
    ),
    ...safeItems
  ].filter(Boolean);
  
  setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
  toast.info('Adding from both pharmacies');
  
  return { pharmacyId, meds: allMeds };
};


const executeBulkAdd = useCallback(async (pharmacyId, medsToAdd) => {
  if (!medsToAdd || medsToAdd.length === 0) return;
  
  try {
    const items = medsToAdd.map(med => ({
      medicationId: med.id,
      pharmacyId,
      quantity: medications.find(m => m.id === med.id)?.quantity || 1
    }));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({
          userIdentifier,
          guestId,
          items,
          prescriptionId: prescriptionMetadata?.id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add medications to cart');
    }

    const result = await response.json();
    await fetchCart();

    const pharmacy = pharmacyRecommendations.find(p => p.pharmacyId === pharmacyId);

 // Map using orderItems from the API response
    setLastAddedItems(
      result.orderItems.map((orderItem, index) => ({
        id: orderItem.id, // ✅ Use orderItem.id (375, 376, 377)
        name: result.addedItems[index].quantity > 1 
          ? `${result.addedItems[index].displayName} x${result.addedItems[index].quantity}` 
          : result.addedItems[index].displayName,
        pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
        quantity: orderItem.quantity
      }))
    );

    setOpenCartDialog(true);
    toast.success(`Added ${result.addedItems.length} item${result.addedItems.length > 1 ? 's' : ''} to cart`);
  } catch (error) {
    console.error('Bulk add error:', error);
    toast.error(error.message || 'Failed to add items');
  }
}, [medications, pharmacyRecommendations, prescriptionMetadata, guestId, userIdentifier, fetchCart, setLastAddedItems, setOpenCartDialog]);



  if (loading) {
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
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-[#225F91]" />
        </div>

        {/* Loading text with shimmer effect */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
            Loading Prescription
          </h2>
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

  if (error) {
    return (
// Premium Dramatic error card with icon
<Card className="relative bg-white/98 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden max-w-lg mx-auto">
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 to-transparent rounded-bl-full" />
  
  <div className="relative p-10 text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl">
      <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
    </div>
    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
      Unable to Load
    </h2>
          <p className="text-red-600 text-base font-medium" aria-live="polite">
            Error: {error}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Please check your prescription link or{' '}
            <Link
              href="/prescription/upload"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
              aria-label="Upload new prescription"
            >
              upload a new prescription
            </Link>.
            Contact{' '}
            <Link
              href="/support"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
              aria-label="Contact support"
            >
              support
            </Link>{' '}
            for help.
          </p>
        </div>
        </Card>
    );
  }


  const getLocationText = () => {
  if (!medications || medications.length === 0) return null; // only show after search ran
  if (!filterState && !filterLga && !filterWard) return null;

  let text = `Filtered by Pharmacies near: ${filterState || ''}`;
  if (filterLga) text += `, ${filterLga}`;
  if (filterWard) text += ` (Ward: ${filterWard})`;

  return text;
};

  return (
   // Gradient background
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
  {/* Add animated background blobs */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F]/5 rounded-full blur-3xl animate-blob" />
    <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#225F91]/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#76D1F3]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
  </div>
      <div className="px-2 sm:px-4">
        <HeroSection
          userName={null}
          prescriptionMetadata={prescriptionMetadata}
          medications={medications}
        />
        <div className='px-2'>
        <PrescriptionInfoCard
          prescriptionMetadata={prescriptionMetadata}
          medications={medications}
          setShowHelp={setShowHelp}
        />
        </div>
        <hr className="border-t border-gray-300 my-4 sm:my-6" />

        {medications.length > 0 && (
      <>

       <div className="my-6 px-2">
          {/* Filter Controls */}
              <FilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filterState={filterState}
                setFilterState={state => {
                  setFilterState(state);
                  updateLgas(state);
                }}
                filterLga={filterLga}
                setFilterLga={lga => {
                  setFilterLga(lga);
                  updateWards(filterState, lga);
                }}
                filterWard={filterWard}
                setFilterWard={setFilterWard}
                states={states}
                lgas={lgas}
                wards={wards}
                geoData={geoData}
                updateLgas={updateLgas}
                updateWards={updateWards}
                clearFilters={() => {
                  setFilterState('');
                  setFilterLga('');
                  setFilterWard('');
                  setSortBy('price');
                  setLgas([]);
                  setWards([]);
                  setMedications(defaultMedications.length > 0 ? defaultMedications : []);
                }}
                handleSearch={() => {}}
                searchTerm={''}
              />
        </div>
        <hr className="border-t border-gray-300 mb-8" />

              <PharmacyRecommendations
                pharmacyRecommendations={pharmacyRecommendations}
                medications={medications}
                handleAddToCart={handleAddToCart}
                handleBulkAddWithDuplicateCheck={handleBulkAddWithDuplicateCheck}
                cart={cart}
                isInCart={isInCart}
                isAddingToCart={isAddingToCart}
                fetchCart={fetchCart}
                setLastAddedItems={setLastAddedItems}
                setOpenCartDialog={setOpenCartDialog}
                userIdentifier={userIdentifier}       
                guestId={guestId}                      
                prescriptionId={prescriptionMetadata?.id} 
                state={filterState}
                lga={filterLga}
                ward={filterWard}
                onRemoveItem={(item) => setRemoveItemDialog(item)}
              />

          <UnifiedRemoveDialog
            removeItem={removeItemDialog}
            bulkRemoveItems={null}
            onClose={() => setRemoveItemDialog(null)}
            onConfirm={async () => {
              if (!removeItemDialog?.id) return;
              
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${removeItemDialog.id}`, {
                  method: 'DELETE',
                  headers: { 'x-guest-id': guestId },
                });
                await fetchCart();
                setRemoveItemDialog(null);
                toast.success('Item removed from cart');
              } catch (error) {
                console.error('Remove error:', error);
                toast.error('Failed to remove item');
              }
            }}
            isRemoving={false}
          />

          </>
        )}


        {prescriptionMetadata?.status === 'VERIFIED' && medications.length === 0 && (
        <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden p-12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-200/30 to-transparent rounded-bl-full" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6 shadow-lg">
              <Pill className="h-10 w-10 text-gray-400" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-gray-700 mb-4">No Medications Found</h3>
              <Link
                href="/prescription/upload"
                className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
                aria-label="Upload new prescription"
              >
                Upload a new prescription
              </Link>{' '}
              or contact{' '}
              <Link
                href="/support"
                className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
                aria-label="Contact support"
              >
                support
              </Link>.
            </div>
          </Card>
        )}
        <FloatingCartSummary
          cartItemsCount={cartItems.length}
          onViewCart={() => window.location.href = '/cart'}
        />
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItems={lastAddedItems}
        onRemoveItems={async (itemIds) => {
          setIsBulkRemoving(true);
          try {
            await bulkRemoveCartItems(guestId, itemIds);
            await fetchCart();
          } catch (error) {
            console.error('Failed to remove items:', error);
            toast.error('Failed to remove items', { duration: 3000 });
          } finally {
            setIsBulkRemoving(false);
          }
        }}
        isRemoving={isBulkRemoving}
      />

        <DuplicateMedicationDialog
          isOpen={duplicateDialog.isOpen}
          onClose={() => setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null })}
          existingItem={duplicateDialog.existingItem}
          newItem={duplicateDialog.newItem}
          onKeepExisting={handleKeepExisting}
          onReplaceWithNew={handleReplaceWithNew}
          onAddBoth={handleAddBoth}
        />

        <BulkDuplicateDialog
          isOpen={bulkDuplicateDialog.isOpen}
          onClose={() => setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null })}
          pharmacyName={bulkDuplicateDialog.pharmacyName}
          duplicates={bulkDuplicateDialog.duplicates}
          safeItemsCount={bulkDuplicateDialog.safeItems.length}
          onKeepExisting={async () => {
            const { safeItems, pharmacyId } = bulkDuplicateDialog;
            setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
            
            if (safeItems.length === 0) {
              toast.info('No new items to add');
              return;
            }
            
            await executeBulkAdd(pharmacyId, safeItems);
          }}
          onReplaceAll={async () => {
            const { duplicates, safeItems, pharmacyId } = bulkDuplicateDialog;
            
            try {
              // Remove all duplicate items from cart
              for (const dup of duplicates) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${dup.cartItemId}`, {
                  method: 'DELETE',
                  headers: { 'x-guest-id': guestId },
                });
              }
              
              await fetchCart();
              
              // Get all meds to add (previously duplicates + safe items)
              const allMeds = [
                ...duplicates.map(d => pharmacyRecommendations
                  .find(p => p.pharmacyId === pharmacyId)?.meds
                  .find(m => m.id === d.medicationId)
                ),
                ...safeItems
              ].filter(Boolean);
              
              setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
              
              await executeBulkAdd(pharmacyId, allMeds);
            } catch (error) {
              console.error(error);
              toast.error('Failed to replace items');
            }
          }}
          onAddAll={async () => {
            const { duplicates, safeItems, pharmacyId } = bulkDuplicateDialog;
            
            // Get all meds to add (keep existing, add new ones too)
            const allMeds = [
              ...duplicates.map(d => pharmacyRecommendations
                .find(p => p.pharmacyId === pharmacyId)?.meds
                .find(m => m.id === d.medicationId)
              ),
              ...safeItems
            ].filter(Boolean);
            
            setBulkDuplicateDialog({ isOpen: false, pharmacyName: '', duplicates: [], safeItems: [], pharmacyId: null });
            
            await executeBulkAdd(pharmacyId, allMeds);
          }}
        />

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
            <DialogTitle>
              <VisuallyHidden>Prescription Image Preview</VisuallyHidden>
            </DialogTitle>
            <img
              src={prescriptionMetadata?.imageUrl}
              alt="Prescription"
              className="w-full h-auto rounded-lg"
            />
          </DialogContent>
        </Dialog>
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
            <DialogTitle>Need Help?</DialogTitle>
            <p className="text-base text-gray-600 mt-2">If you have questions or need assistance, please contact our support team or chat with a pharmacist.</p>
            <div className="flex gap-4 mt-6">
              <Button asChild className="w-full h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971]">
                <Link href="/support">Contact Support</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10">
                <Link href="/chat">Chat with Pharmacist</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

     <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          onClick={() => setShowHelp(true)} 
          className="border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10"
        >
          Need Help?
        </Button>
      </div>
  
  
    {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-6">
        <div className="text-center">
          <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Manzu. Powered by WellRica.</p>
        </div>
      </footer>

      <style jsx>{`
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .animate-blob { animation: blob 7s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }
      .delay-75 { animation-delay: 75ms; }
      .delay-150 { animation-delay: 150ms; }
    `}</style>

    </div>
  );
});

export default PrescriptionMedicationsPage;