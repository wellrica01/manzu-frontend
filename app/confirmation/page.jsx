'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Home, ExternalLink } from 'lucide-react';

export default function Confirmation() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');

  const fetchConfirmation = async () => {
    try {
      setError(null);
      const query = new URLSearchParams();
      if (reference) query.set('reference', reference);
      if (session) query.set('session', session);
      const response = await fetch(`http://localhost:5000/api/confirmation?${query.toString()}`, {
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
    } catch (err) {
      setError(err.message === 'Orders not found' ? 'Orders not found. Please contact support.' : err.message);
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (guestId && (reference || session)) {
      fetchConfirmation();
    } else {
      setError('Missing guest ID, reference, or session ID');
      setStatus('failed');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center">
          Order Confirmation
        </h1>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {confirmationData.pharmacies.length === 0 && !error ? (
          <div className="card text-center py-10 fade-in">
            <p className="text-muted-foreground text-lg">Loading order details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="card card-hover fade-in">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary">
                  Order Status: {status === 'completed' ? 'Successful' : 'Awaiting Verification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-foreground">
                  <strong>Tracking Code:</strong> {confirmationData.trackingCode || 'N/A'}
                </p>
                <p className="text-foreground">
                  <strong>Checkout Session ID:</strong> {confirmationData.checkoutSessionId || 'N/A'}
                </p>
              </CardContent>
            </Card>
            {confirmationData.pharmacies.map((pharmacy, index) => (
              <Card
                key={pharmacy.pharmacy.id}
                className="card card-hover fade-in"
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-2xl font-semibold text-primary">
                    {pharmacy.pharmacy.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{pharmacy.pharmacy.address || 'Address not available'}</p>
                </CardHeader>
                <CardContent className="p-6">
                  {pharmacy.orders.map((order) => (
                    <div key={order.id} className="mb-6 border-b border-border pb-4">
                      <p className="text-foreground">
                        <strong>Order ID:</strong> {order.id}
                      </p>
                      <p className="text-foreground">
                        <strong>Status:</strong>{' '}
                        {order.status === 'confirmed' ? 'Confirmed' : 'Awaiting Prescription Verification'}
                      </p>
                      <p className="text-foreground">
                        <strong>Delivery Method:</strong>{' '}
                        {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                      </p>
                      {order.deliveryMethod === 'pickup' ? (
                        <div>
                          <strong className="text-foreground">Pickup Address:</strong>
                          {getUniquePharmacyAddresses(pharmacy.orders).map((pharmacy, index) => (
                            <p key={index} className="text-muted-foreground">{pharmacy.address}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-foreground">
                          <strong>Delivery Address:</strong> {order.address || 'N/A'}
                        </p>
                      )}
                      {order.prescription && (
                        <p className="text-foreground">
                          <strong>Prescription:</strong>{' '}
                          {order.prescription.status.charAt(0).toUpperCase() + order.prescription.status.slice(1)}
                          {' '}
                          (<a
                            href={order.prescription.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-secondary"
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
                              >
                                Complete Payment
                              </Link>
                            </span>
                          )}
                        </p>
                      )}
                      <h3 className="text-lg font-semibold text-primary mt-4">Order Items</h3>
                      {order.items.map((item) => (
                        <div key={item.id} className="mb-4">
                          <p className="text-foreground font-medium">
                            {item.medication.name}
                            {item.medication.prescriptionRequired && ' (Prescription Required)'}
                          </p>
                          <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                          <p className="text-muted-foreground">Unit Price: ₦{item.price.toLocaleString()}</p>
                          <p className="text-muted-foreground">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                        </div>
                      ))}
                      <p className="text-foreground font-semibold">Order Total: ₦{order.totalPrice.toLocaleString()}</p>
                    </div>
                  ))}
                  <p className="text-xl font-semibold text-primary">
                    Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              onClick={handleBackToHome}
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}