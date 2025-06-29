/*
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
import MedicationCard from './MedicationCard';
import CartDialog from './CartDialog';
import { useCart } from '@/hooks/useCart';

const GuestMed = React.memo(() => {
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
  const { patientIdentifier } = useParams();
  const { cart, fetchCart, guestId } = useCart();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Guest Medications',
        page_path: `/med/guest-med/${patientIdentifier}`,
      });
    }
  }, [patientIdentifier]);

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

  const fetchGuestOrder = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      const url = `http://localhost:5000/api/prescription/guest-med/${patientIdentifier}?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guest order');
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
          page: 'Guest Medications',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [patientIdentifier, userLocation, guestId]);

  useEffect(() => {
    if (patientIdentifier && (userLocation || error)) {
      fetchGuestOrder();
      fetchCart();
    }
  }, [patientIdentifier, userLocation, error, fetchGuestOrder, fetchCart]);

  useEffect(() => {
    setCartItems(cart.pharmacies?.flatMap(p => p.items) || []);
  }, [cart]);

  const handleAddToCart = useCallback(async (medicationId, pharmacyId, medicationName) => {
    const quantity = 1;
    const itemKey = `${medicationId}-${pharmacyId}`;
    try {
      if (!medicationId || !pharmacyId) throw new Error('Invalid medication or pharmacy');
      setIsAddingToCart(prev => ({ ...prev, [itemKey]: true }));
      const response = await fetch('http://localhost:5000/api/cart/add', {
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
          pharmacyMedicationMedicationId: medicationId,
          pharmacyMedicationPharmacyId: pharmacyId,
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
        !(item.pharmacyMedicationMedicationId === medicationId &&
          item.pharmacyMedicationPharmacyId === pharmacyId)
      ));
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [itemKey]: false }));
    }
  }, [guestId, fetchCart]);

  const isInCart = useCallback((medicationId, pharmacyId) => {
    if (!Array.isArray(cartItems)) return false;
    return cartItems.some(
      item => item.pharmacyMedicationMedicationId === medicationId &&
              item.pharmacyMedicationPharmacyId === pharmacyId
    );
  }, [cartItems]);

  const getIntroMessage = () => {
    if (!prescriptionMetadata) return null;
    switch (prescriptionMetadata.status) {
      case 'verified':
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
      case 'pending_admin':
      case 'pending_action':
        return (
          <Card className="shadow-xl border border-yellow-100/50 rounded-2xl bg-yellow-50/90 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
            <h1 className="text-3xl font-extrabold text-[#225F91] mb-2">Prescription Under Review</h1>
            <p className="text-base text-gray-600">
              Your prescription is currently {prescriptionMetadata.status === 'pending_admin' ? 'under review by our team' : 'pending action'}. We’ll notify you when it’s ready to order.{' '}
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
    <div className="space-y-6 p-6 max-w-5xl mx-auto bg-white/95">
      <CartDialog
        openCartDialog={openCartDialog}
        setOpenCartDialog={setOpenCartDialog}
        lastAddedItem={lastAddedItem}
      />
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        {steps.map((step, index) => {
          const statusMap = { uploaded: 0, pending: 1, verified: 2 };
          const currentStep = statusMap[prescriptionMetadata?.status] || 0;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.label || index}>
              <div className="flex flex-col items-center text-center min-w-[60px]">
                <div
                  className={cn(
                    'h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-semibold mb-1 sm:mb-2 text-sm sm:text-base',
                    isCompleted
                      ? 'bg-[#225F91] text-white'
                      : isCurrent
                      ? 'border-2 border-[#225F91] bg-[#225F91]/10 text-[#225F91]'
                      : 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-700">{step.label}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-1 sm:mx-2 rounded-full bg-[#225F91]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {getIntroMessage()}
      {prescriptionMetadata && (
        <Card className="shadow-md border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Prescription #{prescriptionMetadata.id} | Uploaded:{' '}
                {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 capitalize">Status: {prescriptionMetadata.status.replace('_', ' ')}</p>
            </div>
            {prescriptionMetadata.fileUrl && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="h-10 px-4 text-sm font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10"
                aria-label="View prescription image"
              >
                View Prescription
              </Button>
            )}
          </div>
        </Card>
      )}
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
      <Dialog open={!!showMedImage} onOpenChange={() => setShowMedImage(null)}>
        <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
          <DialogTitle>
            <VisuallyHidden>Medication Image Preview</VisuallyHidden>
          </DialogTitle>
          <img
            src={medications.find(med => med.id === showMedImage)?.imageUrl || '/fallback-pill.png'}
            alt={medications.find(med => med.id === showMedImage)?.displayName || 'Medication'}
            className="w-full h-auto rounded-lg"
          />
          {medications.find(med => med.id === showMedImage)?.pillDetails && (
            <p className="text-gray-600 mt-2">
              Color: {medications.find(med => med.id === showMedImage).pillDetails.color}, 
              Shape: {medications.find(med => med.id === showMedImage).pillDetails.shape}
            </p>
          )}
        </DialogContent>
      </Dialog>
      {prescriptionMetadata?.status === 'verified' ? (
        medications.length === 0 ? (
          <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl text-center py-10 bg-white/95 backdrop-blur-sm">
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
        ) : (
          medications.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              isAddingToCart={isAddingToCart}
            />
          ))
        )
      ) : null}
      {prescriptionMetadata?.status === 'verified' && medications.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              asChild
              className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-[#225F91] text-white hover:bg-[#1A4971] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cartItems.length === 0}
              aria-label="View cart"
            >
              <Link href="/med/cart">View Cart</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full hover:bg-[#1ABA7F]/10"
              aria-label="Toggle delivery info"
            >
              {showInfo ? <X className="h-5 w-5 text-[#225F91]" /> : <Info className="h-5 w-5 text-[#225F91]" />}
            </Button>
          </div>
          {showInfo && (
            <Card className="shadow-md border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm p-4">
              <p className="text-base text-gray-600">
                After adding medications to your cart, proceed to checkout to choose delivery or pickup options and complete your secure payment. Your order will be confirmed within 24 hours.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
});

export default GuestMed;
*/