'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2, Info, X, ShoppingCart, MapPin, Pill, HospitalIcon, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import MedicationCard from '@/components/search/MedicationCard';
import PharmacyRecommendations from './PharmacyRecommendations';
import HeroSection from './HeroSection';
import PrescriptionInfoCard from './PrescriptionInfoCard';
import CartDialog from '@/components/search/CartDialog';
import { useCart } from '@/hooks/useCart';
import FilterControls from '@/components/search/FilterControls';
import { Badge } from '@/components/ui/badge';



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
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [lastAddedItems, setLastAddedItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState('med'); // 'med' or 'pharmacy'
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const { userIdentifier } = useParams();
  const { cart, fetchCart, guestId } = useCart();

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
      fetchCart();
    }
  }, [userIdentifier, userLocation, fetchPrescriptionOrder, fetchCart, filterState, filterLga, filterWard]);

  useEffect(() => {
    setCartItems(cart?.pharmacies?.flatMap(p => p.items) || []);
  }, [cart]);

const handleAddToCart = async (medicationId, pharmacyId, displayName) => {
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
        quantity: medications.find(med => med.id === medicationId)?.quantity || 1,
        prescriptionId: prescriptionMetadata?.id,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to cart');
    }
    await fetchCart();
    setLastAddedItems([displayName]); // Update to array
    setOpenCartDialog(true);
    toast.success(`${displayName} added to cart`);
  } catch (error) {
    console.error('Add to cart error:', error);
    toast.error(error.message || 'Failed to add to cart');
  } finally {
    setIsAddingToCart(prev => ({ ...prev, [`${medicationId}-${pharmacyId}`]: false }));
  }
};

const handleBulkAdd = async () => {
  setIsAddingToCart(prev => ({ ...prev, bulk: true }));
  try {
    const prescriptionId = prescriptionMetadata?.id;
    if (!prescriptionId) {
      throw new Error('Prescription ID not found');
    }

    // Select the "best" pharmacy for each medication (e.g., cheapest)
    const items = medications.map(med => {
      const bestAvailability = med.availability?.reduce((best, current) => {
        if (!best || current.price < best.price) return current;
        return best;
      }, null);

      if (!bestAvailability) {
        throw new Error(`No available pharmacy for ${med.displayName}`);
      }

      return {
        medicationId: med.id,
        pharmacyId: bestAvailability.pharmacyId,
        quantity: med.quantity || 1,
        displayName: med.displayName,
      };
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/addbulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId,
      },
      body: JSON.stringify({
        userIdentifier,
        guestId,
        items,
        prescriptionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add medications to cart');
    }

    const result = await response.json();
    await fetchCart();
    setLastAddedItems(result.addedItems.map(item => item.displayName));
    setOpenCartDialog(true);
    toast.success(`Added ${result.addedItems.length} medications to cart`);
  } catch (error) {
    console.error('Bulk add error:', error);
    toast.error(error.message || 'Failed to add medications to cart');
  } finally {
    setIsAddingToCart(prev => ({ ...prev, bulk: false }));
  }
};

  const isInCart = (medicationId, pharmacyId) => {
    return cart?.pharmacies?.some(pharmacy =>
      pharmacy.pharmacy.id === pharmacyId &&
      pharmacy.items?.some(item => item.medication.id === medicationId)
    ) || false;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-50 animate-pulse" />
            <Loader2 className="relative w-20 h-20 text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
          </div>
          <div className="text-center mt-8">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
              Loading Prescription
            </h2>
            <div className="flex justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce delay-150" />
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
        <PrescriptionInfoCard
          prescriptionMetadata={prescriptionMetadata}
          medications={medications}
        />
        <hr className="border-t border-gray-300 my-4 sm:my-6" />
        {medications.length > 0 && (
          <>

    {/* Simple side-by-side toggle buttons */}
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-3 shadow-lg border-2 border-gray-200/50" role="tab">
    <div className="grid grid-cols-2 sm:flex gap-2">
      <button
        onClick={() => setViewMode('med')}
        className={cn(
          "group relative flex flex-col sm:flex-row items-center justify-center gap-2 py-2 sm:py-4 px-2 sm:p-4 rounded-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2",
          viewMode === 'med'
            ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white shadow-xl scale-105"
            : "bg-transparent text-gray-600 hover:bg-white hover:shadow-md"
        )}
      >
        <Pill className="h-5 w-5 mr-2" strokeWidth={2.5} />
        By Medications
      </button>
      <button
            onClick={() => setViewMode('pharmacy')}
            className={cn(
              "group relative flex flex-col sm:flex-row items-center justify-center gap-2 py-2 sm:py-4 px-2 sm:p-4 rounded-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] focus:ring-offset-2",
              viewMode === 'pharmacy'
            ? "bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white shadow-xl scale-105"
            : "bg-transparent text-gray-600 hover:bg-white hover:shadow-md"
            )}
          >
            <HospitalIcon className='h-5 w-5' strokeWidth={2.5} />
            {viewMode === 'pharmacy' ? "Grouped by Pharmacies" : "Group by Pharmacies"}
      </button>
      </div>
      </div>

    <hr className="border-t border-gray-300 mb-8" />

       <div className="my-6">
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

            {viewMode === 'med' ? (
              <Accordion type="single" collapsible className="mb-24 space-y-4">
                {medications.map((med, index) => (
                  <AccordionItem key={med.id} value={med.id} className="relative bg-white/98 backdrop-blur-xl 
                  border-2 border-[#1ABA7F]/30 rounded-3xl shadow-xl hover:shadow-3xl 
                  transition-all duration-500 hover:-translate-y-1 overflow-hidden group">
                  
                  {/* Add decorative corner */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-br-full" />
                  <AccordionTrigger className="p-4 sm:p-6 hover:bg-gradient-to-r hover:from-[#1ABA7F]/5 hover:to-transparent transition-all duration-300 group">
                    <div className="flex flex-col gap-6 w-full">
                      {/* Row 1: Title (left) + Image (right) */}
                      <div className="flex gap-4 w-full items-center">
                        {/* Title */}
                        <h4 className="text-2xl sm:text-3xl font-black text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300 flex-1 min-w-0">
                          {med.displayName}
                        </h4>

                        {/* Image */}
                            <div className="relative group flex-shrink-0 w-24 h-24">
                              <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                              <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                                {med.imageUrl ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <img
                                        src={med.imageUrl}
                                        alt={med.displayName}
                                        className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-110"
                                      />
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl p-0 border-0 rounded-3xl overflow-hidden">
                                      <VisuallyHidden>
                                        <DialogTitle>{med.displayName}</DialogTitle>
                                      </VisuallyHidden>
                                      <img src={med.imageUrl} alt={med.displayName} className="w-full h-auto" />
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <Pill className="w-16 h-16 text-gray-400" aria-label="Medication" />
                                  </div>
                                )}
                              </div>
                            </div>
                      </div>


                      {/* Row 2: Info grid + Availability */}
                      <div className="flex flex-col gap-4 w-full">
                        {/* Info grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full">

                          {/* Composition */}
                         {med.ingredients?.length > 0 && (
                            <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composition</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {med.ingredients.map(i => `${i.activeSubstance} ${i.strengthValue}${i.strengthUnit}`).join(", ")}
                              </p>
                            </div>
                          )}

                          {/* NAFDAC Code */}
                          <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <span className="text-xs font-black text-gray-600 uppercase tracking-wide block mb-1">
                              NAFDAC Code
                            </span>
                            <span className="text-sm text-gray-800 font-bold">{med.nafdacCode || 'N/A'}</span>
                          </div>

                          {/* Manufacturer */}
                          {med.manufacturerName && (
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 sm:col-span-2">
                              <span className="text-xs font-black text-gray-600 uppercase tracking-wide block mb-1">
                                Manufacturer
                              </span>
                              <span className="text-sm text-gray-800 font-bold">
                                {med.manufacturerName} {med.manufacturerCountry && `• ${med.manufacturerCountry}`}
                              </span>
                            </div>
                          )}

                          {/* Pack Size */}

                           {med.packSizeExpression && (
                              <div className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1ABA7F]/50 transition-colors duration-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pack Size</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 font-mono">{med.packSizeExpression} {med.packSizeUnit}</p>
                              </div>
                            )}
                        </div>

                        {/* Availability Badge */}
                        <Badge className="bg-gradient-to-r from-[#1ABA7F]/20 to-[#225F91]/20 text-[#225F91] border-2 border-[#1ABA7F]/30 font-black px-4 py-2 text-sm">
                          <MapPin className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
                          Available at {med.availability?.length || 0} Pharmacies
                        </Badge>
                      </div>
                    </div>

                  </AccordionTrigger>
                    <AccordionContent className="p-3 sm:p-4">
                       <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <MedicationCard
                        med={med}
                        handleAddToCart={handleAddToCart}
                        isInCart={isInCart}
                        isAddingToCart={isAddingToCart}
                        isMultiMed={true}
                        searchTerm=""
                        state={filterState}
                        lga={filterLga}
                        ward={filterWard}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <PharmacyRecommendations
                pharmacyRecommendations={pharmacyRecommendations}
                medications={medications}
                handleAddToCart={handleAddToCart}
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
              />
            )}
          </>
        )}

   {/* Bulk add button 
    <Button className="group relative h-16 px-6 w-fit rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-black shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden">
      <span className="relative z-10 text-base flex items-center gap-3">
        <ShoppingCart className="h-6 w-6" strokeWidth={2.5} />
        Add Best Options ({medications.length} meds)
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </Button> 
    */}

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