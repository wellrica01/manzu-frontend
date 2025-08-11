'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2, Info, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import MedicationCard from '@/components/search/MedicationCard';
import CartDialog from '@/components/search/CartDialog';
import { useCart } from '@/hooks/useCart';
import FilterControls from '@/components/search/FilterControls';
import { Badge } from '@/components/ui/badge';

// Hero Section with concise welcome message
const HeroSection = ({ userName, prescriptionMetadata }) => (
  <div className="mb-8 text-center">
    <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-2 animate-in slide-in-from-top-2 duration-500">
      {userName ? `Hi ${userName}, ` : ''}My Prescription Details
    </h1>
    <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto animate-in fade-in-20 duration-700">
      Review your prescribed medications below, compare prices, select pharmacies, and order with fast, secure delivery or pickup.
    </p>
    {prescriptionMetadata && (
      <div className="flex flex-wrap justify-center gap-3 mt-3 animate-in zoom-in-50 duration-700">
        <Badge className="bg-[#1ABA7F]/20 text-[#1ABA7F] border-0">Verified on {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}</Badge>
        <Badge className="bg-[#225F91]/20 text-[#225F91] border-0">Secure & Confidential</Badge>
        <Badge className="bg-[#1ABA7F]/20 text-[#225F91] border-0">Fast Delivery</Badge>
      </div>
    )}
  </div>
);

// Prescription Info Card to display detailed prescription information
const PrescriptionInfoCard = ({ prescriptionMetadata, medications }) => {
  if (!prescriptionMetadata) return null;

  const renderMedicationList = () => (
    <div className="mt-4">
      <h4 className="text-base sm:text-lg font-semibold text-[#225F91] mb-3">Prescribed Medications</h4>
      {medications.length === 0 ? (
        <p className="text-gray-600">No medications found for this prescription.</p>
      ) : (
        <ul className="space-y-3">
          {medications.map((med) => (
            <li key={med.id} className="border-b border-gray-200 pb-2">
              <p className="text-gray-800 text-sm sm:text-base font-medium">{med.displayName}</p>
              {med.manufacturer && (
                <p className="text-xs text-gray-600">Manufacturer: {med.manufacturer}</p>
              )}
              <p className="text-xs text-gray-600">Quantity: {med.quantity} {med.packSizeUnit}</p>
              {med.dosageInstructions && (
                <p className="text-xs text-gray-600">Dosage: {med.dosageInstructions}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-6 sm:px-6 mb-6">
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      {prescriptionMetadata.status === 'VERIFIED' ? (
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-2">Prescription Summary</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Your prescription, uploaded on {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}, is verified and ready to order.{' '}
            <Link
              href="/support"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
              aria-label="Contact support"
            >
              Contact us
            </Link>{' '}
            if anything looks incorrect.
          </p>
          {renderMedicationList()}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-[#225F91] mb-2">Prescription Under Review</h2>
          <p className="text-base text-gray-600 mb-4">
            Your prescription, uploaded on {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}, is currently under review. We’ll notify you when it’s ready to order.{' '}
            <Link
              href="/support"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
              aria-label="Contact support"
            >
              Contact support
            </Link>{' '}
            for assistance.
          </p>
          {renderMedicationList()}
        </div>
      )}
    </Card>
  );
};

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
  const [prescriptionMetadata, setPrescriptionMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMedImage, setShowMedImage] = useState(null);
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

  // Update LGAs when state changes
  const updateLgas = useCallback((state) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    setLgas(stateData ? stateData.lgas.map(lga => ({ value: lga.name, label: lga.name })) : []);
    setWards([]);
    setFilterLga('');
    setFilterWard('');
  }, [geoData]);

  // Update wards when LGA changes
  const updateWards = useCallback((state, lga) => {
    if (!geoData) return;
    const stateData = geoData.find(s => s.state === state);
    const lgaData = stateData?.lgas.find(l => l.name === lga);
    setWards(lgaData ? lgaData.wards.map(ward => ({ value: ward.name, label: ward.name })) : []);
    setFilterWard('');
  }, [geoData]);

  // Filtering logic for pharmacies
  const filterAndSortAvailability = useCallback((availability) => {
    if (!availability) return [];
    let filtered = [...availability];
    switch (sortBy) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'distance':
        filtered.sort((a, b) => {
          const aDist = typeof a.distance_km === 'number' ? a.distance_km : Infinity;
          const bDist = typeof b.distance_km === 'number' ? b.distance_km : Infinity;
          return aDist - bDist;
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.pharmacyName.localeCompare(b.pharmacyName));
        break;
      default:
        break;
    }
    return filtered;
  }, [sortBy]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Prescription Medications',
        page_path: `/prescriptions/${userIdentifier}`,
      });
    }
  }, [userIdentifier]);

  // Attempt to fetch geolocation, but don't set error on failure
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

  const fetchPrescriptionOrder = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      if (filterState) queryParams.append('state', filterState);
      if (filterLga) queryParams.append('lga', filterLga);
      if (filterWard) queryParams.append('ward', filterWard);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/prescriptions/${userIdentifier}?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch prescription order');
      }
      const data = await response.json();
      setMedications(data.medications || []);
      setPrescriptionMetadata(data.prescriptionMetadata || null);
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

  const handleAddToCart = async (medicationId, pharmacyId, medicationName) => {
    const quantity = 1;
    const itemKey = `${medicationId}-${pharmacyId}`;
    try {
      if (!medicationId || !pharmacyId) throw new Error('Invalid selection');
      setIsAddingToCart(prev => ({ ...prev, [itemKey]: true }));
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ medicationId, pharmacyId, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }
      setLastAddedItem(medicationName);
      setOpenCartDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', { medicationId, pharmacyId });
      }
      await fetchCart();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const isInCart = (medicationId, pharmacyId) => {
    return cart?.pharmacies?.some(pharmacy =>
      pharmacy.pharmacy.id === pharmacyId &&
      pharmacy.items?.some(item => item.medication.id === medicationId)
    ) || false;
  };

  const [showHelp, setShowHelp] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 pt-6 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />
    <div className="py-14 px-2 sm:px-4">
      <HeroSection userName={null} prescriptionMetadata={prescriptionMetadata} />
      <PrescriptionInfoCard prescriptionMetadata={prescriptionMetadata} medications={medications} />
      {medications.length > 0 && (
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
          }}
          handleSearch={() => {}}
          searchTerm={''}
        />
      )}
      <div className="space-y-10 mt-8">
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
        {prescriptionMetadata?.status === 'VERIFIED' && medications.length > 0 && medications.map((med) => (
          <MedicationCard
            key={med.id}
            med={med}
            handleAddToCart={handleAddToCart}
            isInCart={isInCart}
            isAddingToCart={isAddingToCart}
          />
        ))}
      </div>
      <FloatingCartSummary
        cartItemsCount={cartItems.length}
        onViewCart={() => window.location.href = '/cart'}
      />
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItem={lastAddedItem}
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