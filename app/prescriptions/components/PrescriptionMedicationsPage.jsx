'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import MedicationCard from '@/components/search/MedicationCard';
import CartDialog from '@/components/search/CartDialog';
import { useCart } from '@/hooks/useCart';
import FilterControls from '@/components/search/FilterControls';
import { Badge } from '@/components/ui/badge';

// Hero Section
const HeroSection = ({ userName }) => (
  <div className="mb-8 text-center">
    <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-2 animate-in slide-in-from-top-2 duration-500">
      {userName ? `Hi ${userName}, ` : ''}Your Prescription is Ready!
    </h1>
    <div className="flex flex-wrap justify-center gap-3 mt-3 animate-in zoom-in-50 duration-700">
      <Badge className="bg-[#1ABA7F]/20 text-[#1ABA7F] border-0">Verified by Pharmacist</Badge>
      <Badge className="bg-[#225F91]/20 text-[#225F91] border-0">Secure & Confidential</Badge>
      <Badge className="bg-[#1ABA7F]/20 text-[#225F91] border-0">Fast Delivery</Badge>
    </div>
    <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto animate-in fade-in-20 duration-700">
      Order your prescribed medications from trusted pharmacies below. Compare prices, choose your preferred pharmacy, and enjoy fast, secure delivery or pickup.
    </p>
  </div>
);

// Prescription Summary Card
const PrescriptionSummaryCard = ({ metadata, onViewPrescription, onHelp }) => {
  if (!metadata) return null;
  const statusSteps = [
    { label: 'Uploaded', complete: true },
    { label: 'Verified', complete: metadata.status === 'VERIFIED' },
    { label: 'Ready to Order', complete: metadata.status === 'VERIFIED' },
  ];
  return (
    <Card className="mb-8 shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">Prescription #{metadata.id}</span>
            <span className="text-xs text-gray-500">Uploaded: {new Date(metadata.uploadedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <span className="text-sm font-bold text-[#225F91] capitalize">{metadata.status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {statusSteps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center font-semibold text-xs ${step.complete ? 'bg-[#1ABA7F] text-white' : 'bg-gray-200 text-gray-400'}`}>{step.complete ? '✓' : idx + 1}</div>
                {idx < statusSteps.length - 1 && <div className="w-8 h-1 rounded-full bg-[#1ABA7F]/30" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {metadata.fileUrl && (
            <Button variant="outline" onClick={onViewPrescription} className="h-10 px-4 text-sm font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10 animate-in fade-in-20 duration-700">View Prescription</Button>
          )}
          <Button variant="ghost" onClick={onHelp} className="h-10 px-4 text-sm font-semibold rounded-full text-[#225F91] hover:bg-[#225F91]/10 animate-in fade-in-20 duration-700">Need Help?</Button>
        </div>
      </div>
    </Card>
  );
};

// Floating Cart Summary
const FloatingCartSummary = ({ cartItemsCount, onViewCart }) => {
  if (cartItemsCount === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <Button
        onClick={onViewCart}
        className="h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white shadow-xl hover:scale-105 transition-transform duration-200"
        aria-label="View Cart"
      >
        View Cart ({cartItemsCount})
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
    // Only sort, since filtering is now backend
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
          toast.error('Unable to fetch location. Showing all pharmacies.', { duration: 4000 });
          setError('Unable to fetch location; showing all pharmacies');
        }
      );
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
      const url = `http://localhost:5000/api/prescription/prescriptions/${userIdentifier}?${queryParams.toString()}`;
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
      setError(err.message || 'Unknown error');
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
    if (userIdentifier && (userLocation || error)) {
      fetchPrescriptionOrder();
      fetchCart();
    }
  }, [userIdentifier, userLocation, error, fetchPrescriptionOrder, fetchCart, filterState, filterLga, filterWard]);

  useEffect(() => {
    setCartItems(cart?.pharmacies?.flatMap(p => p.items) || []);
  }, [cart]);

  const handleAddToCart = useCallback(async (medicationId, pharmacyId, medicationName) => {
    const quantity = 1;
    const itemKey = `${medicationId}-${pharmacyId}`;
    try {
      if (!medicationId || !pharmacyId) throw new Error('Invalid medication or pharmacy');
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
      setCartItems(prev => [
        ...prev,
        {
          medicationAvailabilityMedicationId: medicationId,
          medicationAvailabilityPharmacyId: pharmacyId,
          quantity,
          medication: { displayName: medicationName },
        },
      ]);
      setLastAddedItem(medicationName);
      setOpenCartDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', { medicationId, pharmacyId });
      }
      await fetchCart();
    } catch (err) {
      toast.error(`Error: ${err.message}`, { duration: 4000 });
      setCartItems(prev => prev.filter(item =>
        !(item.medicationAvailabilityMedicationId === medicationId &&
          item.medicationAvailabilityPharmacyId === pharmacyId)
      ));
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [itemKey]: false }));
    }
  }, [guestId, fetchCart]);

  const isInCart = useCallback((medicationId, pharmacyId) => {
    if (!Array.isArray(cartItems)) return false;
    return cartItems.some(
      item => item.medicationAvailabilityMedicationId === medicationId &&
              item.medicationAvailabilityPharmacyId === pharmacyId
    );
  }, [cartItems]);

  const getIntroMessage = () => {
    if (!prescriptionMetadata) return null;
    switch (prescriptionMetadata.status) {
      case 'VERIFIED':
        return (
          <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
            <p className="text-base text-gray-600">
              Your prescription has been verified by our team. Select your preferred pharmacies below to order your medications.{' '}
              <Link
                href="/support"
                className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
                aria-label="Contact support"
              >
                Contact us
              </Link>{' '}
              if anything looks incorrect.
            </p>
          </Card>
        );
      case 'PENDING':
        return (
          <Card className="shadow-xl border border-yellow-100/50 rounded-2xl bg-yellow-50/90 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
            <h1 className="text-3xl font-extrabold text-[#225F91] mb-2">Prescription Under Review</h1>
            <p className="text-base text-gray-600">
              Your prescription is currently under review by our team. We’ll notify you when it’s ready to order.{' '}
              <Link
                href="/support"
                className="text-[#225F91] hover:text-[#1A4971] underline font-semibold"
                aria-label="Contact support"
              >
                Contact support
              </Link>{' '}
              for assistance.
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  const steps = [
    { label: 'Uploaded', description: 'You submitted the prescription' },
    { label: 'Verifying', description: 'Pharmacist is reviewing' },
    { label: 'Ready to Order', description: 'Place your order' },
  ];

  // Modal state for help
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
    <div className="container mx-auto max-w-5xl py-8">
      <HeroSection userName={null} />
      <PrescriptionSummaryCard
        metadata={prescriptionMetadata}
        onViewPrescription={() => setShowPreview(true)}
        onHelp={() => setShowHelp(true)}
      />
      {/* Filter Controls for pharmacies (as-is) */}
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
      {/* Medications List */}
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
            // Optionally pass extra props for enhanced UI
          />
        ))}
      </div>
      {/* Floating Cart Summary */}
      <FloatingCartSummary
        cartItemsCount={cartItems.length}
        onViewCart={() => window.location.href = '/cart'}
      />
      {/* Cart Dialog */}
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItem={lastAddedItem}
      />
      {/* Prescription Image Modal */}
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
      {/* Help Modal */}
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
  );
});

export default PrescriptionMedicationsPage;