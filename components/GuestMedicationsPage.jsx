'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Loader2, CheckCircle, Info, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GuestOrder() {
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
  const { patientIdentifier } = useParams();
  const router = useRouter();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Guest Medications',
        page_path: `/guest-order/${patientIdentifier}`,
      });
    }
  }, [patientIdentifier]);

  // Geolocation
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

  // Fetch guest order
  const fetchGuestOrder = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      const url = `http://localhost:5000/api/prescription/guest-order/${patientIdentifier}?${queryParams.toString()}`;
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
  };

  // Fetch cart
  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCartItems(data.pharmacies?.flatMap(p => p.items) || []);
    } catch (err) {
      console.error('Fetch cart error:', err);
      toast.error('Failed to sync cart', { duration: 4000 });
    }
  };

  useEffect(() => {
    if (patientIdentifier && (userLocation || error)) {
      fetchGuestOrder();
      fetchCart();
    }
  }, [patientIdentifier, userLocation, error]);

  // Add to cart
  const handleAddToCart = async (medicationId, pharmacyId, medicationName) => {
    const quantity = 1;
    try {
      setCartItems(prev => [
        ...prev,
        {
          pharmacyMedicationMedicationId: medicationId,
          pharmacyMedicationPharmacyId: pharmacyId,
          quantity,
          medication: { displayName: medicationName },
        },
      ]);
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
    }
  };

  const isInCart = (medicationId, pharmacyId) => {
    if (!Array.isArray(cartItems)) return false;
    return cartItems.some(
      (item) => item.pharmacyMedicationMedicationId === medicationId && item.pharmacyMedicationPharmacyId === pharmacyId
    );
  };

  // Dynamic introductory message
  const getIntroMessage = () => {
    if (!prescriptionMetadata) return null;
    switch (prescriptionMetadata.status) {
      case 'verified':
        return (
          <Card className="shadow-xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <h1 className="text-3xl font-extrabold text-primary mb-2">Your Prescription Medications</h1>
            <p className="text-base text-gray-600">
              Your prescription has been verified by our team. Select your preferred pharmacies below to order your medications.{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
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
          <Card className="shadow-xl border border-yellow-100/50 rounded-3xl bg-yellow-50/90 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <h1 className="text-3xl font-extrabold text-primary mb-2">Prescription Under Review</h1>
            <p className="text-base text-gray-600">
              Your prescription is currently {prescriptionMetadata.status === 'pending_admin' ? 'under review by our team' : 'pending action'}. We’ll notify you when it’s ready to order.{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
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

  if (loading) {
    return (
      <div className="text-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" aria-hidden="true" />
        <p className="text-gray-600 mt-2 text-lg font-medium">Loading prescription...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-md border border-red-100/50 rounded-2xl bg-red-50/90 backdrop-blur-sm p-4 mx-auto max-w-5xl">
        <p className="text-red-600 text-base font-medium text-center" aria-live="polite">
          Error: {error}
        </p>
        <p className="text-gray-600 text-base text-center mt-2">
          Please ensure your prescription link is correct or{' '}
          <Link
            href="/prescription/upload"
            className="text-primary hover:text-blue-600 underline font-semibold"
            aria-label="Upload new prescription"
          >
            upload a new prescription
          </Link>.
          Contact{' '}
          <Link
            href="/support"
            className="text-primary hover:text-blue-600 underline font-semibold"
            aria-label="Contact support"
          >
            support
          </Link>{' '}
          for assistance.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto bg-gradient-to-b from-gray-50/95 to-gray-100/95 animate-in fade-in-20 duration-500">
      {/* Introductory Section */}
      {getIntroMessage()}

      {/* Prescription Metadata */}
      {prescriptionMetadata && (
        <Card className="shadow-md border border-gray-100/50 rounded-2xl bg-gray-50/90 backdrop-blur-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Prescription #{prescriptionMetadata.id} | Uploaded:{' '}
                {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 capitalize">Status: {prescriptionMetadata.status.replace('_', ' ')}</p>
            </div>
            {prescriptionMetadata.imageUrl && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="h-10 px-4 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50"
                aria-label="View prescription image"
              >
                View Prescription
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Prescription Image Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-gray-100/30">
          <img
            src={prescriptionMetadata?.imageUrl}
            alt="Prescription"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>

      {/* Cart Confirmation Dialog */}
      <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
        <DialogContent
          className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={() => document.getElementById(`add-to-cart-${lastAddedItem}`)?.focus()}
        >
          <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
          <DialogHeader className="flex flex-col items-center gap-3">
            <CheckCircle
              className="h-12 w-12 text-green-500 animate-[pulse_1s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight text-center">
              Added to Cart!
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600 text-base font-medium mt-2">
            <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your cart.
          </p>
          <DialogFooter className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Button>
            <Button
              asChild
              className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
            >
              <Link href="/cart" aria-label="View cart">View Cart</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medications (only for verified prescriptions) */}
      {prescriptionMetadata?.status === 'verified' ? (
        medications.length === 0 ? (
          <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <p className="text-gray-600 text-xl font-medium">
              No medications found for this prescription.{' '}
              <Link
                href="/prescription/upload"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Upload new prescription"
              >
                Upload a new prescription
              </Link>{' '}
              or contact{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Contact support"
              >
                support
              </Link>.
            </p>
          </Card>
        ) : (
          medications.map((med) => (
            <Card
              key={med.id}
              className="relative shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] animate-in slide-in-from-top-10"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
                    {med.displayName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {med.prescriptionRequired && (
                      <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
                        Prescription Needed
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {med.genericName || 'Generic N/A'}
                    </span>
                    <div className="relative group flex items-center">
                      <span className="text-base font-medium text-gray-600">
                        Quantity: {med.quantity}
                      </span>
                      <Info className="h-4 w-4 text-primary/50 ml-1" aria-hidden="true" />
                      <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-2 mt-1 shadow-lg max-w-xs">
                        This is the prescribed quantity. You can adjust it in the cart.
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600 text-base">
                      <strong className="font-semibold text-gray-800">NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
                    </p>
                  </div>
                </div>
                {med.imageUrl && (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                    <img
                      src={med.imageUrl}
                      alt={med.displayName}
                      className="w-full h-full object-cover rounded-2xl border border-gray-200/50 shadow-md transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Compare Pharmacies</h3>
                {med.availability && med.availability.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" aria-describedby={`pharmacy-comparison-${med.id}`}>
                      <caption id={`pharmacy-comparison-${med.id}`} className="sr-only">
                        Comparison of pharmacies for {med.displayName}
                      </caption>
                      <thead>
                        <tr className="bg-primary/5 text-sm font-semibold text-gray-700">
                          <th className="p-4 rounded-tl-xl">Pharmacy</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Distance</th>
                          <th className="p-4 rounded-tr-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {med.availability.map((avail, index) => {
                          const validDistances = med.availability
                            .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
                            .map((a) => a.distance_km);
                          const isCheapest =
                            avail.price === Math.min(...med.availability.map((a) => a.price));
                          const isClosest =
                            validDistances.length > 0 &&
                            typeof avail.distance_km === 'number' &&
                            !isNaN(avail.distance_km) &&
                            avail.distance_km === Math.min(...validDistances);
                          return (
                            <tr
                              key={index}
                              className="border-t border-gray-100/50 hover:bg-primary/10 transition-colors duration-200"
                            >
                              <td className="p-4">
                                <p className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                                  {avail.pharmacyName}
                                </p>
                                {avail.address && (
                                  <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">
                                    {avail.address}
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-gray-800">
                                    ₦{avail.price.toLocaleString()}
                                  </span>
                                  {isCheapest && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-green-600 bg-green-100 rounded-full animate-bounce">
                                      Cheapest
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km) ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-base text-gray-600">
                                      {avail.distance_km.toFixed(1)} km
                                    </span>
                                    {isClosest && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-bounce">
                                        Closest
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-base">N/A</span>
                                )}
                              </td>
                              <td className="p-4">
                                <Button
                                  id={`add-to-cart-${med.id}-${avail.pharmacyId}`}
                                  onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.displayName)}
                                  disabled={isInCart(med.id, avail.pharmacyId)}
                                  className={cn(
                                    'h-10 px-5 text-sm font-semibold rounded-full transition-all duration-300',
                                    isInCart(med.id, avail.pharmacyId)
                                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                      : 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse'
                                  )}
                                  aria-label={isInCart(med.id, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                                >
                                  <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                                  {isInCart(med.id, avail.pharmacyId) ? 'Added' : 'Add to Cart'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-base italic p-4">
                    Not available at any verified pharmacy
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )
      ) : null}

      {/* Delivery Guidance (only for verified prescriptions with medications) */}
      {prescriptionMetadata?.status === 'verified' && medications.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              asChild
              className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
              disabled={cartItems.length === 0}
              aria-label="View cart"
            >
              <Link href="/cart">View Cart</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full hover:bg-gray-100/50 transition-all duration-200"
              aria-label="Toggle delivery info"
            >
              {showInfo ? <X className="h-5 w-5 text-primary" /> : <Info className="h-5 w-5 text-primary" />}
            </Button>
          </div>
          {showInfo && (
            <Card className="shadow-md border border-gray-100/50 rounded-2xl bg-gray-50/90 backdrop-blur-sm p-4">
              <p className="text-base text-gray-600">
                After adding medications to your cart, proceed to checkout to choose delivery or pickup options and complete your secure payment. Your order will be confirmed within 24 hours.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}