'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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


// Constants
const API_TIMEOUT = 30000;
const DEBOUNCE_DELAY = 300;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

const ERROR_MESSAGES = {
  PRESCRIPTION_NOT_FOUND: 'Prescription not found',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  ADD_TO_CART_FAILED: 'Failed to add item to cart',
  REMOVE_FROM_CART_FAILED: 'Failed to remove item from cart',
  LOAD_GEO_DATA_FAILED: 'Failed to load location data',
  TIMEOUT: 'Request timed out. Please try again.',
  UNKNOWN: 'An unexpected error occurred'
};

// Utilities
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async (url, options = {}, timeoutMs = API_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.TIMEOUT);
    }
    throw error;
  }
};

const fetchWithRetry = async (url, options = {}, maxRetries = MAX_RETRY_ATTEMPTS) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        await delay(RETRY_DELAY * (attempt + 1));
      }
    }
  }
  
  throw lastError;
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function reverseGeocode(userLat, userLng, geoData) {
  if (!geoData?.length || !userLat || !userLng) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  geoData.forEach((state) => {
    if (!state?.lgas) return;
    
    state.lgas.forEach((lga) => {
      const lgaCoords = lga.wards?.map(w => [w.latitude, w.longitude]).filter(c => c[0] && c[1]) || [];
      if (lgaCoords.length === 0) return;
      
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

// Floating Cart Component
const FloatingCartSummary = React.memo(({ cartItemsCount, onViewCart }) => {
  if (cartItemsCount === 0) return null;
  
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-50 animate-pulse" />
        <Button 
          onClick={onViewCart}
          aria-label={`View cart with ${cartItemsCount} items`}
          className="relative h-16 px-10 rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-white"
        >
          <ShoppingCart className="h-6 w-6 mr-3" strokeWidth={3} aria-hidden="true" />
          Go to Cart ({cartItemsCount})
        </Button>
      </div>
    </div>
  );
});

FloatingCartSummary.displayName = 'FloatingCartSummary';

// Main Component
const PrescriptionMedicationsPage = React.memo(() => {
  
  const [medications, setMedications] = useState([]);
  const [defaultMedications, setDefaultMedications] = useState([]);
  const [prescriptionMetadata, setPrescriptionMetadata] = useState(null);
  const [pharmacyRecommendations, setPharmacyRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBulkDialogProcessing, setIsBulkDialogProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState({});
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
    pharmacyId: null,
    allMeds: []
  });

  const [geoData, setGeoData] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  const { userIdentifier } = useParams();
  const searchParams = useSearchParams();
  const urlGuestId = searchParams.get('guestId');
  const { cart, fetchCart, isInCart, guestId: cartGuestId } = useCart();
  const guestId = urlGuestId || cartGuestId;
  const cartItems = useMemo(() => cart?.pharmacies?.flatMap(p => p.items) || [], [cart]);
  const isMountedRef = useRef(true);
  const fetchControllerRef = useRef(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
  if (urlGuestId && urlGuestId !== localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', urlGuestId);
  }
}, [urlGuestId]);


  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const response = await fetch('/data/full.json');
        if (!response.ok) throw new Error('Failed to load geo data');
        
        const data = await response.json();
        if (!isMountedRef.current) return;
        
        setGeoData(data);
        setStates(data.map(state => ({ value: state.state, label: state.state })));
      } catch (err) {
        console.error('Failed to load geo data:', err);
        if (isMountedRef.current) {
          toast.error(ERROR_MESSAGES.LOAD_GEO_DATA_FAILED, { duration: 4000 });
        }
      }
    };

    loadGeoData();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.info('Geolocation not supported. Showing all pharmacies.', { duration: 4000 });
      return;
    }

    const geoOptions = {
      timeout: 10000,
      maximumAge: 0,
      enableHighAccuracy: true
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        if (isMountedRef.current) {
          toast.info('Unable to fetch location. Showing all pharmacies.', { duration: 4000 });
          setUserLocation(null);
        }
      },
      geoOptions
    );
  }, []);

  const updateLgas = useCallback((state) => {
    if (!geoData?.length || !state) {
      setLgas([]);
      setWards([]);
      setFilterLga('');
      setFilterWard('');
      return;
    }
    
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData?.lgas?.map(lga => ({ value: lga.name, label: lga.name })) || []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  }, [geoData]);

  const updateWards = useCallback((state, lga) => {
    if (!geoData?.length || !state || !lga) {
      setWards([]);
      setFilterWard('');
      return;
    }
    
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas?.find(l => l.name === lga);
    setWards(lgaData?.wards?.map(ward => ({ value: ward.name, label: ward.name })) || []);
    setFilterWard('');
  }, [geoData]);

  useEffect(() => {
    if (userLocation && geoData?.length) {
      const match = reverseGeocode(userLocation.lat, userLocation.lng, geoData);
      if (match && isMountedRef.current) {
        setFilterState(match.state);
        updateLgas(match.state);
        setFilterLga(match.lga);
        updateWards(match.state, match.lga);
        setFilterWard('');
      }
    }
  }, [userLocation, geoData, updateLgas, updateWards]);

  useEffect(() => {
    const noFilters = !filterState && !filterLga && !filterWard;
    if (noFilters && defaultMedications.length > 0) {
      setMedications(defaultMedications);
    }
  }, [filterState, filterLga, filterWard]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && userIdentifier) {
      window.gtag('event', 'page_view', {
        page_title: 'Prescription Medications',
        page_path: `/prescriptions/${userIdentifier}`,
      });
    }
  }, [userIdentifier]);

  const fetchPrescriptionOrder = useCallback(async () => {
    if (!userIdentifier || !guestId) return;

    try {
      const queryParams = new URLSearchParams();
      if (userLocation?.lat && userLocation?.lng) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/${userIdentifier}?${queryParams.toString()}`;
      
      fetchControllerRef.current = new AbortController();
      const response = await fetchWithRetry(url, {
        headers: { 'x-guest-id': guestId },
        signal: fetchControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || ERROR_MESSAGES.PRESCRIPTION_NOT_FOUND);
      }
      
      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      setMedications(data.medications || []);
      setDefaultMedications(data.medications || []);
      setPrescriptionMetadata(data.prescriptionMetadata || null);
      setPharmacyRecommendations(data.pharmacyRecommendations || []);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error('Fetch prescription error:', err);
      
      if (!isMountedRef.current) return;
      
      const errorMessage = err.message || ERROR_MESSAGES.UNKNOWN;
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'error', {
          error_message: errorMessage,
          page: 'Prescription Medications',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userIdentifier, userLocation, guestId, filterState, filterLga, filterWard]);

  useEffect(() => {
    if (userIdentifier && guestId) {
      setLoading(true);
      fetchPrescriptionOrder();
    }
  }, [userIdentifier, guestId, filterState, filterLga, filterWard, fetchPrescriptionOrder]);

  const addToCartInternal = useCallback(async (medicationId, pharmacyId, displayName, quantity = 1) => {
    const cartKey = `${medicationId}-${pharmacyId}`;
    setIsAddingToCart(prev => ({ ...prev, [cartKey]: true }));
    
    try {
      const response = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({
            userIdentifier: userIdentifier || '',
            medicationId,
            pharmacyId,
            quantity,
            prescriptionId: prescriptionMetadata?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || ERROR_MESSAGES.ADD_TO_CART_FAILED);
      }

      const result = await response.json();
      
      if (!isMountedRef.current) return;
      
      await fetchCart();

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
      setLastAddedItems([{
        id: result.orderItem?.id,
        name: quantity > 1 ? `${displayName} x${quantity}` : displayName,
        pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
        quantity: result.orderItem?.quantity || quantity
      }]);

      setOpenCartDialog(true);
      toast.success(`${displayName} added to cart`);
    } catch (error) {
      console.error('Add to cart error:', error);
      
      if (!isMountedRef.current) return;
      
      toast.error(error.message || ERROR_MESSAGES.ADD_TO_CART_FAILED);
    } finally {
      if (isMountedRef.current) {
        setIsAddingToCart(prev => ({ ...prev, [cartKey]: false }));
      }
    }
  }, [userIdentifier, guestId, prescriptionMetadata, pharmacyRecommendations, fetchCart]);

  const handleAddToCart = useCallback(async (medicationId, pharmacyId, displayName) => {
    const existingInCart = cart?.pharmacies?.find(pharmacy => 
      pharmacy?.items?.some(item => 
        item?.medication?.id === medicationId && pharmacy?.pharmacy?.id !== pharmacyId
      )
    );

    if (existingInCart) {
      const existingItem = existingInCart.items.find(item => item?.medication?.id === medicationId);
      const newPharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
      const newMed = newPharmacy?.meds?.find(m => m.id === medicationId);
      const medQuantity = medications?.find(m => m.id === medicationId)?.quantity || 1;

      setDuplicateDialog({
        isOpen: true,
        existingItem: {
          medicationName: displayName,
          pharmacyName: existingInCart.pharmacy?.name || 'Unknown Pharmacy',
          price: existingItem?.price || 0,
          quantity: existingItem?.quantity || 1,
          cartItemId: existingItem?.id,
          pharmacyId: existingInCart.pharmacy?.id
        },
        newItem: {
          medicationName: displayName,
          pharmacyName: newPharmacy?.pharmacyName || 'Unknown Pharmacy',
          price: newMed?.price || 0,
          quantity: medQuantity,
          medicationId,
          pharmacyId
        }
      });
      return;
    }

    const medQuantity = medications?.find(m => m.id === medicationId)?.quantity || 1;
    await addToCartInternal(medicationId, pharmacyId, displayName, medQuantity);
  }, [cart, pharmacyRecommendations, medications, addToCartInternal]);

  const handleKeepExisting = useCallback(() => {
    toast.info('Keeping your current selection');
    setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
  }, []);

  const handleReplaceWithNew = useCallback(async () => {
    const { existingItem, newItem } = duplicateDialog;
    if (!existingItem || !newItem) return;

    try {
      await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${existingItem.cartItemId}`,
        {
          method: 'DELETE',
          headers: { 'x-guest-id': guestId || '' },
        }
      );
      
      await fetchCart();
      await addToCartInternal(newItem.medicationId, newItem.pharmacyId, newItem.medicationName, newItem.quantity);

      toast.success(`Switched to ${newItem.pharmacyName}`);
      setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
    } catch (error) {
      console.error('Replace error:', error);
      toast.error(error.message || 'Failed to replace item');
    }
  }, [duplicateDialog, guestId, fetchCart, addToCartInternal]);

  const handleAddBoth = useCallback(async () => {
    const { newItem } = duplicateDialog;
    if (!newItem) return;

    try {
      await addToCartInternal(newItem.medicationId, newItem.pharmacyId, newItem.medicationName, newItem.quantity);
      toast.info('Added from both pharmacies');
      setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
    } catch (error) {
      console.error('Add both error:', error);
      toast.error('Failed to add both items');
    }
  }, [duplicateDialog, addToCartInternal]);


const handleBulkAddWithDuplicateCheck = useCallback(async (pharmacyId, meds) => {
  if (!meds?.length) return null;

  const duplicates = [];
  const safeToAdd = [];

  meds.forEach(med => {
    if (!med?.id) return;

    if (isInCart(med.id, pharmacyId)) {
      return;
    }

    const existingInCart = cart?.pharmacies?.find(pharmacy => 
      pharmacy?.items?.some(item => 
        item?.medication?.id === med.id && pharmacy?.pharmacy?.id !== pharmacyId
      )
    );

    if (existingInCart) {
      const existingItem = existingInCart.items.find(item => item?.medication?.id === med.id);
      
      // FIX: Get pharmacy name from existingInCart, not undefined pharmacyName variable
      const currentPharmacyName = existingInCart.pharmacy?.pharmacyName 
        || existingInCart.pharmacy?.name 
        || 'Unknown Pharmacy';
      
      duplicates.push({
        medicationId: med.id,
        medicationName: med.displayName || 'Unknown Medication',
        currentPharmacy: currentPharmacyName,  // ✅ Use the variable we just defined
        currentPrice: existingItem?.price || 0,
        newPrice: med.price || 0,
        quantity: existingItem?.quantity || 1,
        cartItemId: existingItem?.id,
        currentPharmacyId: existingInCart.pharmacy?.id
      });
    } else {
      safeToAdd.push(med);
    }
  });

  if (duplicates.length > 0) {
    const currentPharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
    
    setBulkDuplicateDialog({
      isOpen: true,
      pharmacyName: currentPharmacy?.pharmacyName || 'this pharmacy',
      duplicates,
      safeItems: safeToAdd,
      pharmacyId,
      allMeds: meds
    });
    return null;
  }

  return { pharmacyId, meds: safeToAdd };
}, [cart, isInCart, pharmacyRecommendations]);


const handleBulkKeepExisting = useCallback(async () => {
  const { safeItems, pharmacyId } = bulkDuplicateDialog;
  
  if (!safeItems?.length || !pharmacyId) {
    toast.info('No new items to add');
    setBulkDuplicateDialog({ 
      isOpen: false, 
      pharmacyName: '', 
      duplicates: [], 
      safeItems: [], 
      pharmacyId: null, 
      allMeds: [] 
    });
    return;
  }

  setIsBulkDialogProcessing(true);
  
  try {
    // Filter out items already in cart from this pharmacy
    const itemsToAdd = safeItems.filter(med => 
      med?.id && !isInCart(med.id, pharmacyId)
    );
    
    if (itemsToAdd.length === 0) {
      toast.info('All items already in cart');
      setBulkDuplicateDialog({ 
        isOpen: false, 
        pharmacyName: '', 
        duplicates: [], 
        safeItems: [], 
        pharmacyId: null, 
        allMeds: [] 
      });
      return;
    }

    const items = itemsToAdd.map(med => ({
      medicationId: med.id,
      pharmacyId,
      quantity: medications?.find(m => m.id === med.id)?.quantity || 1
    }));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId || '',
        },
        body: JSON.stringify({
          userIdentifier: userIdentifier || '',
          guestId: guestId || '',
          items,
          prescriptionId: prescriptionMetadata?.id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add medications');
    }

    const result = await response.json();
    await fetchCart();

    const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

    if (result?.orderItems?.length && result?.addedItems?.length) {
      setLastAddedItems(
        result.orderItems.map((orderItem, index) => ({
          id: orderItem.id,
          name: result.addedItems[index].displayName,
          pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
          quantity: orderItem.quantity
        }))
      );
    }

    setOpenCartDialog(true);
    
    // Close dialog AFTER successful addition
    setBulkDuplicateDialog({ 
      isOpen: false, 
      pharmacyName: '', 
      duplicates: [], 
      safeItems: [], 
      pharmacyId: null, 
      allMeds: [] 
    });
    
    toast.success(`Added ${itemsToAdd.length} new item${itemsToAdd.length > 1 ? 's' : ''}`);
  } catch (error) {
    console.error('Failed to add safe items:', error);
    toast.error(error.message || 'Failed to add items');
    // Keep dialog open on error
  } finally {
    setIsBulkDialogProcessing(false);
  }
}, [bulkDuplicateDialog, isInCart, medications, guestId, userIdentifier, prescriptionMetadata, pharmacyRecommendations, fetchCart, setLastAddedItems, setOpenCartDialog]);
const handleBulkReplaceAll = useCallback(async () => {
  const { duplicates, pharmacyId, allMeds } = bulkDuplicateDialog;
  
  if (!duplicates?.length || !pharmacyId) return;

  setIsBulkDialogProcessing(true);

  try {
    // Collect all cart item IDs to remove
    const itemIdsToRemove = duplicates
      .map(dup => dup.cartItemId)
      .filter(Boolean);
    
    if (itemIdsToRemove.length > 0) {
      // Use bulk remove API - single request instead of loop
      await bulkRemoveCartItems(guestId, itemIdsToRemove);
    }
    
    // Wait for cart refresh to complete
    await fetchCart();
    
    // Small delay to ensure cart state is fully updated
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Now add all the new items
    const itemsToAdd = allMeds.filter(med => 
      med?.id && !isInCart(med.id, pharmacyId)
    );

    if (itemsToAdd.length > 0) {
      const items = itemsToAdd.map(med => ({
        medicationId: med.id,
        pharmacyId,
        quantity: medications?.find(m => m.id === med.id)?.quantity || 1
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({
            userIdentifier: userIdentifier || '',
            guestId: guestId || '',
            items,
            prescriptionId: prescriptionMetadata?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add medications');
      }

      const result = await response.json();
      await fetchCart();

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

      if (result?.orderItems?.length && result?.addedItems?.length) {
        setLastAddedItems(
          result.orderItems.map((orderItem, index) => ({
            id: orderItem.id,
            name: result.addedItems[index].displayName,
            pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
            quantity: orderItem.quantity
          }))
        );
      }

      setOpenCartDialog(true);
    }
    
    // Close dialog after successful operation
    setBulkDuplicateDialog({ 
      isOpen: false, 
      pharmacyName: '', 
      duplicates: [], 
      safeItems: [], 
      pharmacyId: null, 
      allMeds: [] 
    });
    
    toast.success(`Replaced ${duplicates.length} item${duplicates.length > 1 ? 's' : ''} successfully`);
  } catch (error) {
    console.error('Bulk replace error:', error);
    toast.error(error.message || 'Failed to replace items');
    // Keep dialog open on error so user can retry
  } finally {
    setIsBulkDialogProcessing(false);
  }
}, [bulkDuplicateDialog, guestId, fetchCart, isInCart, medications, userIdentifier, prescriptionMetadata, pharmacyRecommendations, setLastAddedItems, setOpenCartDialog]);

const handleBulkAddAll = useCallback(async () => {
  const { allMeds, pharmacyId } = bulkDuplicateDialog;
  
  if (!allMeds?.length || !pharmacyId) {
    toast.error('No items to add');
    setBulkDuplicateDialog({ 
      isOpen: false, 
      pharmacyName: '', 
      duplicates: [], 
      safeItems: [], 
      pharmacyId: null, 
      allMeds: [] 
    });
    return;
  }

  setIsBulkDialogProcessing(true);
  
  try {
    // Filter out items already in cart from this pharmacy
    const itemsToAdd = allMeds.filter(med => 
      med?.id && !isInCart(med.id, pharmacyId)
    );
    
    if (itemsToAdd.length === 0) {
      toast.info('All items already in cart');
      setBulkDuplicateDialog({ 
        isOpen: false, 
        pharmacyName: '', 
        duplicates: [], 
        safeItems: [], 
        pharmacyId: null, 
        allMeds: [] 
      });
      return;
    }

    const items = itemsToAdd.map(med => ({
      medicationId: med.id,
      pharmacyId,
      quantity: medications?.find(m => m.id === med.id)?.quantity || 1
    }));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId || '',
        },
        body: JSON.stringify({
          userIdentifier: userIdentifier || '',
          guestId: guestId || '',
          items,
          prescriptionId: prescriptionMetadata?.id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add medications');
    }

    const result = await response.json();
    
    await fetchCart();

    const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

    if (result?.orderItems?.length && result?.addedItems?.length) {
      setLastAddedItems(
        result.orderItems.map((orderItem, index) => ({
          id: orderItem.id,
          name: result.addedItems[index].displayName,
          pharmacy: pharmacy?.pharmacyName || "Unknown Pharmacy",
          quantity: orderItem.quantity
        }))
      );
    }

    setOpenCartDialog(true);
    
    // Close dialog after successful addition
    setBulkDuplicateDialog({ 
      isOpen: false, 
      pharmacyName: '', 
      duplicates: [], 
      safeItems: [], 
      pharmacyId: null, 
      allMeds: [] 
    });
    
    toast.success('Added items from both pharmacies');
  } catch (error) {
    console.error('Failed to add all items:', error);
    toast.error(error.message || 'Failed to add items');
    // Keep dialog open on error so user can retry
  } finally {
    setIsBulkDialogProcessing(false);
  }
}, [bulkDuplicateDialog, isInCart, medications, guestId, userIdentifier, prescriptionMetadata, pharmacyRecommendations, fetchCart, setLastAddedItems, setOpenCartDialog]);


  const clearFilters = useCallback(() => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSortBy('price');
    setLgas([]);
    setWards([]);
    if (defaultMedications.length > 0) {
      setMedications(defaultMedications);
    }
  }, [defaultMedications]);

    if (!mounted) {
    return null; // Return nothing on server
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative p-1 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-8">
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
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-[#225F91]" aria-hidden="true" />
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
              Loading Prescription
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4" aria-label="Loading">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 flex items-center justify-center">
        <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden max-w-lg mx-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 to-transparent rounded-bl-full" />
          
          <div className="relative p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl">
              <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
              Unable to Load
            </h2>
            <p className="text-red-600 text-base font-medium mb-4" role="alert">
              {error}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen p-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F]/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#225F91]/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#76D1F3]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <main className="py-8 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto lg:flex lg:gap-8">
          <div className="flex-1 min-w-0">
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
                    clearFilters={clearFilters}
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
                      await fetchWithTimeout(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${removeItemDialog.id}`,
                        {
                          method: 'DELETE',
                          headers: { 'x-guest-id': guestId || '' },
                        }
                      );
                      await fetchCart();
                      setRemoveItemDialog(null);
                      toast.success('Item removed from cart');
                    } catch (error) {
                      console.error('Remove error:', error);
                      toast.error(error.message || ERROR_MESSAGES.REMOVE_FROM_CART_FAILED);
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
                    <Pill className="h-10 w-10 text-gray-400" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-700 mb-4">No Medications Found</h3>
                  <p className="text-gray-600 mb-4">
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
                  </p>
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
                if (!itemIds?.length) return;
                
                setIsBulkRemoving(true);
                try {
                  await bulkRemoveCartItems(guestId, itemIds);
                  await fetchCart();
                  toast.success(`Removed ${itemIds.length} item${itemIds.length > 1 ? 's' : ''}`, { duration: 3000 });
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
                onClose={() => {
                  if (isBulkDialogProcessing) return; // Prevent closing while processing
                  setBulkDuplicateDialog({ 
                    isOpen: false, 
                    pharmacyName: '', 
                    duplicates: [], 
                    safeItems: [], 
                    pharmacyId: null, 
                    allMeds: [] 
                  });
                }}
                pharmacyName={bulkDuplicateDialog.pharmacyName}
                duplicates={bulkDuplicateDialog.duplicates}
                safeItems={bulkDuplicateDialog.safeItems}
                safeItemsCount={bulkDuplicateDialog.safeItems.length}
                medications={medications}
                onKeepExisting={handleBulkKeepExisting}
                onReplaceAll={handleBulkReplaceAll}
                onAddAll={handleBulkAddAll}
                isProcessing={isBulkDialogProcessing} 
              />

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
                <DialogTitle>
                  <VisuallyHidden>Prescription Image Preview</VisuallyHidden>
                </DialogTitle>
                {prescriptionMetadata?.imageUrl && (
                  <img
                    src={prescriptionMetadata.imageUrl}
                    alt="Prescription preview"
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showHelp} onOpenChange={setShowHelp}>
              <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
                <DialogTitle>Need Help?</DialogTitle>
                <p className="text-base text-gray-600 mt-2">
                  If you have questions or need assistance, please contact our support team or chat with a pharmacist.
                </p>
                <div className="flex gap-4 mt-6">
                  <Button 
                    asChild 
                    className="w-full h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971]"
                  >
                    <Link href="/support">Contact Support</Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10"
                  >
                    <Link href="/chat">Chat with Pharmacist</Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>

      <div className="flex justify-center mt-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setShowHelp(true)}
          aria-label="Need help? Contact support"
          className="border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10"
        >
          Need Help?
        </Button>
      </div>

      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-6">
        <div className="text-center">
          <p className="text-sm opacity-90">
            &copy; {new Date().getFullYear()} Manzu. Powered by WellRica.
          </p>
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
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-700 { animation-delay: 700ms; }
      `}</style>
    </div>
  );
});


PrescriptionMedicationsPage.displayName = 'PrescriptionMedicationsPage';

{/* const PrescriptionMedicationsPageWithErrorBoundary = () => {
  return (
    <NetworkErrorBoundary>
      <ErrorBoundary>
        <PrescriptionMedicationsPage />
      </ErrorBoundary>
    </NetworkErrorBoundary>
  );
};

export default PrescriptionMedicationsPageWithErrorBoundary; */}

// Use this instead
export default PrescriptionMedicationsPage;


