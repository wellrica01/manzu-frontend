'use client';
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
          Order Confirmation
        </h1>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-3 mb-4" role="alert">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}
        {loading && (
          <div className="card text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground text-base mt-2">Loading order details...</p>
          </div>
        )}
        {!loading && confirmationData.pharmacies.length === 0 && !error ? (
          <div className="card text-center py-8">
            <p className="text-muted-foreground text-base">No order details available.</p>
          </div>
        ) : (
          <>
            <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-primary">
                    {status === 'completed' ? 'Payment Successful' : 'Order Awaiting Verification'}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-foreground">
                    {status === 'completed'
                      ? `Your payment of ₦${confirmationData.pharmacies.reduce((sum, p) => sum + p.subtotal, 0).toLocaleString()} was successful.`
                      : 'Your order has been placed and is awaiting prescription verification.'}
                    <br />
                    Tracking Code: <span className="font-medium">{confirmationData.trackingCode}</span>
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBackToHome}
                    className="w-full sm:w-auto"
                    aria-label="Back to home"
                  >
                    Back to Home
                  </Button>
                  <Button
                    onClick={handleTrackOrder}
                    className="w-full sm:w-auto"
                    aria-label="Track order"
                  >
                    Track Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="space-y-4">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-semibold text-primary">
                    Order Status: {status === 'completed' ? 'Successful' : 'Awaiting Verification'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-foreground text-sm">
                    <strong>Tracking Code:</strong> {confirmationData.trackingCode || 'N/A'}
                  </p>
                  <p className="text-foreground text-sm">
                    <strong>Checkout Session ID:</strong> {confirmationData.checkoutSessionId || 'N/A'}
                  </p>
                </CardContent>
              </Card>
              {confirmationData.pharmacies.map((pharmacy, index) => (
                <Card
                  key={pharmacy.pharmacy.id}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                  style={{ animation: 'fadeIn 0.5s ease-in', animationDelay: `${0.2 * index}s` }}
                >
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-xl font-semibold text-primary truncate">
                      {pharmacy.pharmacy.name}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm truncate">{pharmacy.pharmacy.address || 'Address not available'}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    {pharmacy.orders.map((order) => (
                      <div key={order.id} className="mb-4 border-b border-border pb-3">
                        <p className="text-foreground text-sm">
                          <strong>Order ID:</strong> {order.id}
                        </p>
                        <p className="text-foreground text-sm">
                          <strong>Status:</strong>{' '}
                          {order.status === 'confirmed' ? 'Confirmed' : 'Awaiting Prescription Verification'}
                        </p>
                        <p className="text-foreground text-sm">
                          <strong>Delivery Method:</strong>{' '}
                          {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </p>
                        {order.deliveryMethod === 'pickup' ? (
                          <div>
                            <strong className="text-foreground text-sm">Pickup Address:</strong>
                            {getUniquePharmacyAddresses(pharmacy.orders).map((pharmacy, index) => (
                              <p key={index} className="text-muted-foreground text-sm truncate">{pharmacy.address}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-foreground text-sm">
                            <strong>Delivery Address:</strong> {order.address || 'N/A'}
                          </p>
                        )}
                        {order.prescription && (
                          <p className="text-foreground text-sm">
                            <strong>Prescription:</strong>{' '}
                            {order.prescription.status.charAt(0).toUpperCase() + order.prescription.status.slice(1)}
                            {' '}
                            (<a
                              href={order.prescription.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-secondary"
                              aria-label="View prescription file"
                            >
                              <ExternalLink className="h-4 w-4 inline-block mr-1" />
                              View File
                            </a>)
                            {order.prescription.status === 'verified' && order.status === 'pending_prescription' && (
                              <span>
                                {' '}
                                <Link
                                  href={`/checkout/${order.id}`}
                                  className="text-primary hover:text-secondary"
                                  aria-label="Complete payment for order"
                                >
                                  Complete Payment
                                </Link>
                              </span>
                            )}
                          </p>
                        )}
                        <h3 className="text-base font-semibold text-primary mt-3">Order Items</h3>
                        {order.items.map((item) => (
                          <div key={item.id} className="mb-3">
                            <p className="text-foreground text-sm font-medium truncate">
                              {item.medication.name}
                              {item.medication.prescriptionRequired && ' (Prescription Required)'}
                            </p>
                            <p className="text-muted-foreground text-sm">Quantity: {item.quantity}</p>
                            <p className="text-muted-foreground text-sm">Unit Price: ₦{item.price.toLocaleString()}</p>
                            <p className="text-muted-foreground text-sm">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                          </div>
                        ))}
                        <p className="text-foreground text-sm font-semibold">Order Total: ₦{order.totalPrice.toLocaleString()}</p>
                      </div>
                    ))}
                    <p className="text-lg font-semibold text-primary">
                      Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6 mt-2"
                onClick={handleBackToHome}
                aria-label="Back to home"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}