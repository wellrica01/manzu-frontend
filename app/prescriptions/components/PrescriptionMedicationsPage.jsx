'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2, Info, X, ShoppingCart } from 'lucide-react';
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
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <Button
        onClick={onViewCart}
        className="h-12 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white shadow-xl hover:scale-105 transition-transform duration-200"
        aria-label="View Cart"
      >
        Go to cart ({cartItemsCount})
        <ShoppingCart className="ml-2 h-6 w-6" />
      </Button>
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

const handleAddToCart = async (medicationId, pharmacyId, fullName) => {
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
    setLastAddedItems([fullName]); // Update to array
    setOpenCartDialog(true);
    toast.success(`${fullName} added to cart`);
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
        throw new Error(`No available pharmacy for ${med.fullName}`);
      }

      return {
        medicationId: med.id,
        pharmacyId: bestAvailability.pharmacyId,
        quantity: med.quantity || 1,
        fullName: med.fullName,
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
    setLastAddedItems(result.addedItems.map(item => item.fullName));
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
        <Loader2 className="h-8 w-8 animate-spin text-[#225F91]" aria-hidden="true" />
        <p className="text-gray-600 mt-2 text-base font-medium">Loading your prescription...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50/90 rounded-xl p-6 max-w-md text-center">
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
      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-300/50 to-white/10 sm:py-8 pt-6 pb-12 px-2 sm:px-6 lg:px-8 relative opacity-100 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />
      <div className="py-10 px-2 sm:px-4">
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
            <div className="flex flex-col sm:flex-row justify-between items-center my-6 gap-4">
               
           {/* Section Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-[#225F91]">
            Filter Pharmacies by Location
          </h3>

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


  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-6">
    {/* Bulk add button */}
    <Button
      onClick={handleBulkAdd}
      className="h-12 bg-[#1ABA7F] text-white hover:bg-[#1A4971] w-full sm:w-auto mb-4"
    >
      Add Best Options to Cart ({medications.length} meds)
    </Button>

    {/* Simple side-by-side toggle buttons */}
    <div className="flex w-full sm:w-auto gap-2 justify-center">
      <Button
        onClick={() => setViewMode('med')}
        className={cn(
          "h-12 px-4 text-xs sm:text-base font-medium w-1/2 sm:w-auto",
          viewMode === 'med'
            ? "bg-[#225F91] text-white border border-[#225F91]"
            : "bg-white text-[#225F91] border border-gray-300 hover:bg-gray-50"
        )}
      >
        {viewMode === 'med' ? "Grouped by Medications" : "Group by Medications"}
      </Button>

      <Button
        onClick={() => setViewMode('pharmacy')}
        className={cn(
          "h-12 px-4 text-xs sm:text-base font-medium w-1/2 sm:w-auto",
          viewMode === 'pharmacy'
            ? "bg-[#225F91] text-white border border-[#225F91]"
            : "bg-white text-[#225F91] border border-gray-300 hover:bg-gray-50"
        )}
      >
        {viewMode === 'pharmacy' ? "Grouped by Pharmacies" : "Group by Pharmacies"}
      </Button>
    </div>
  </div>
  <hr className="border-t border-gray-300 mb-8" />

            {viewMode === 'med' ? (
              <Accordion type="single" collapsible className="space-y-4">
                {medications.map((med, index) => (
                  <AccordionItem key={med.id} value={med.id} className="bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-lg 
                  transition-all duration-300 hover:shadow-xl hover:border-[#1ABA7F]/40">
                    <AccordionTrigger className="p-4 flex justify-between items-start gap-2 hover:text-[#1ABA7F] hover:no-underline">
                    <div className="flex flex-col sm:flex-row gap-2 items-start">
                      <h4 className="text-base sm:text-lg font-bold text-[#225F91]">{med.fullName}</h4>
                        <div className='text-xs'>
                          <span className="font-semibold text-gray-600">Generic Name:</span>
                          <span className="ml-2 text-gray-600 font-medium">{med.genericName || 'N/A'}</span>
                        </div>
                        {med.manufacturerName && (
                          <div className='text-xs'>
                            <span className="text-gray-600 font-semibold">Manufacturer:</span>
                            <span className="ml-2 text-gray-600 font-medium">{med.manufacturerName || 'N/A'} - {med.manufacturerCountry}</span>
                          </div>
                        )}
                        <div className='text-xs'>
                          <span className="font-semibold text-gray-600">NAFDAC Code:</span>
                          <span className="ml-2 text-gray-600 font-medium">{med.nafdacCode || 'N/A'}</span>
                        </div>
                        <Badge className="bg-[#1ABA7F]/20 text-[#1ABA7F]">
                          Available at {med.availability?.length || 0} Pharmacies
                        </Badge>
                        </div>
                          <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0">
                          {med.imageUrl ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <img
                                    src={med.imageUrl}
                                    alt={med.fullName}
                                    className="w-full h-full object-cover rounded-xl p-1 border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer"
                                  />
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <VisuallyHidden>
                                    <DialogTitle>{med.fullName}</DialogTitle>
                                  </VisuallyHidden>
                                  <img
                                    src={med.imageUrl}
                                    alt={med.fullName}
                                    className="w-full h-auto rounded-lg shadow-lg"
                                  />
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Pill className="w-12 h-12 sm:w-20 sm:h-20 text-[#1ABA7F]/60" aria-label="Medication" />
                            )}
                            </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4">
                       <hr className="border-t border-gray-300" />
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
        {prescriptionMetadata?.status === 'VERIFIED' && medications.length === 0 && (
          <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl text-center py-10 bg-white/95 backdrop-blur-sm animate-in fade-in-20 duration-700">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
            <p className="text-gray-600 text-xl font-medium">
              No medications found for this prescription.{' '}
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
    </div>
  );
});

export default PrescriptionMedicationsPage;