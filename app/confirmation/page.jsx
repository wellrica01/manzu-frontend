'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Home, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Confirmation() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');

  const validateQueryParams = () => {
    if (!guestId) return 'Missing guest ID';
    if (!reference && !session) return 'Missing reference or session ID';
    return null;
  };

  const fetchConfirmation = async () => {
    const validationError = validateQueryParams();
    if (validationError) {
      setError(validationError);
      toast.error(validationError, { duration: 4000 });
      setStatus('failed');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const query = new URLSearchParams();
      if (reference) query.set('reference', reference);
      if (session) query.set('session', session);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmation?${query.toString()}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify payment');
      }
      const data = await response.json();
      setConfirmationData({
        pharmacies: data.pharmacies,
        trackingCode: data.trackingCode,
        checkoutSessionId: data.checkoutSessionId,
      });
      setStatus(data.status);
      setShowConfirmationDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_confirmation', { trackingCode: data.trackingCode });
      }
    } catch (err) {
      const errorMsg = err.message === 'Orders not found' ? 'Orders not found. Please contact support.' : err.message;
      setError(errorMsg);
      toast.error(errorMsg, {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: () => fetchConfirmation(),
        },
      });
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guestId && (reference || session)) {
      fetchConfirmation();
    } else {
      setError('Missing guest ID, reference, or session ID');
      toast.error('Missing guest ID, reference, or session ID', { duration: 4000 });
      setStatus('failed');
      setLoading(false);
    }
  }, [reference, session]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = (pharmacyOrders) => {
    const addresses = [];
    const seen = new Set();
    pharmacyOrders.forEach(order => {
      const address = order.pharmacy?.address;
      const pharmacyName = order.pharmacy?.name;
      if (address && pharmacyName && !seen.has(address)) {
        addresses.push({ name: pharmacyName, address });
        seen.add(address);
      }
    });
    return addresses;
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleTrackOrder = () => {
    router.push(`/track?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
  };

return (
  <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
    <div className="container mx-auto max-w-5xl">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
        Order Confirmation
      </h1>
      {error && (
        <Card
          className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500"
          role="alert"
        >
          <p className="text-red-600 text-base font-medium">{error}</p>
        </Card>
      )}
      {loading && (
        <Card
          className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md text-center py-12 animate-in slide-in-from-top-10 duration-500"
        >
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-gray-600 text-lg font-medium mt-3">Loading order details...</p>
        </Card>
      )}
      {!loading && confirmationData.pharmacies.length === 0 && !error ? (
        <Card
          className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md text-center py-12 animate-in slide-in-from-top-10 duration-500"
        >
          <p className="text-gray-600 text-lg font-medium">No order details available.</p>
        </Card>
      ) : (
        <>
          <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
            <DialogContent
              className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CheckCircle
                className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
                aria-hidden="true"
              />
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
                  {status === 'completed' ? 'Payment Successful' : 'Order Awaiting Verification'}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-base text-gray-600 text-center font-medium">
                  {status === 'completed'
                    ? `Your payment of ₦${confirmationData.pharmacies.reduce((sum, p) => sum + p.subtotal, 0).toLocaleString()} was successful.`
                    : 'Your order has been placed and is awaiting prescription verification.'}
                  <br />
                  Tracking Code: <span className="font-semibold text-gray-900">{confirmationData.trackingCode}</span>
                </p>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={handleBackToHome}
                  className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                  aria-label="Back to home"
                >
                  Back to Home
                </Button>
                <Button
                  onClick={handleTrackOrder}
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                  aria-label="Track order"
                >
                  Track Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="space-y-6">
            <Card
              className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="bg-primary/10 p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                  Order Status: {status === 'completed' ? 'Successful' : 'Awaiting Verification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-base font-medium">
                  <p>
                    <strong className="text-gray-900">Tracking Code:</strong> {confirmationData.trackingCode || 'N/A'}
                  </p>
                  <p>
                    <strong className="text-gray-900">Checkout Session ID:</strong> {confirmationData.checkoutSessionId || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
            {confirmationData.pharmacies.map((pharmacy, index) => (
              <Card
                key={pharmacy.pharmacy.id}
                className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] animate-in fade-in-20"
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
                <CardHeader className="bg-primary/10 p-6 sm:p-8">
                  <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary truncate">
                    {pharmacy.pharmacy.name}
                  </CardTitle>
                  <p className="text-gray-600 text-base font-medium truncate">{pharmacy.pharmacy.address || 'Address not available'}</p>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {pharmacy.orders.map((order) => (
                    <div key={order.id} className="mb-6 border-b border-gray-200/50 pb-4 last:border-b-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-sm font-medium">
                        <p>
                          <strong className="text-gray-900">Order ID:</strong> {order.id}
                        </p>
                        <p>
                          <strong className="text-gray-900">Status:</strong>{' '}
                          {order.status === 'confirmed' ? 'Confirmed' : 'Awaiting Prescription Verification'}
                        </p>
                        <p>
                          <strong className="text-gray-900">Delivery Method:</strong>{' '}
                          {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </p>
                        {order.deliveryMethod === 'pickup' ? (
                          <div>
                            <strong className="text-gray-900">Pickup Address:</strong>
                            {getUniquePharmacyAddresses(pharmacy.orders).map((pharmacy, index) => (
                              <p key={index} className="text-gray-600 truncate">{pharmacy.address}</p>
                            ))}
                          </div>
                        ) : (
                          <p>
                            <strong className="text-gray-900">Delivery Address:</strong> {order.address || 'N/A'}
                          </p>
                        )}
                        {order.prescription && (
                          <p>
                            <strong className="text-gray-900">Prescription:</strong>{' '}
                            {order.prescription.status.charAt(0).toUpperCase() + order.prescription.status.slice(1)}
                            {' '}
                            <a
                              href={order.prescription.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                              aria-label="View prescription file"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View
                            </a>
                            {order.prescription.status === 'verified' && order.status === 'pending_prescription' && (
                              <span>
                                {' '}
                                <Link
                                  href={`/checkout/${order.id}`}
                                  className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                                  aria-label="Complete payment for order"
                                >
                                  Complete Payment
                                </Link>
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-primary mt-4">Order Items</h3>
                      {order.items.map((item) => (
                        <div key={item.id} className="mb-3 mt-2">
                          <p className="text-gray-900 text-base font-medium truncate">
                            {item.medication.name}
                            {item.medication.prescriptionRequired && ' (Prescription Required)'}
                          </p>
                          <p className="text-gray-600 text-sm font-medium">Quantity: {item.quantity}</p>
                          <p className="text-gray-600 text-sm font-medium">Unit Price: ₦{item.price.toLocaleString()}</p>
                          <p className="text-gray-600 text-sm font-medium">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                        </div>
                      ))}
                      <p className="text-gray-900 text-base font-semibold mt-2">
                        Order Total: ₦{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <p className="text-lg font-extrabold text-primary">
                    Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full h-14 px-8 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
              onClick={handleBackToHome}
              aria-label="Back to home"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </>
      )}
    </div>
  </div>
);
}
