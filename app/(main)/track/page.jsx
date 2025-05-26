'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function Track() {
  const [trackingCode, setTrackingCode] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const router = useRouter();
  const formRef = useRef(null);

  const validateTrackingCode = (code) => {
    return /^TRK-SESSION-\d+-\d+$/.test(code);
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingCode) {
      setError('Please enter a tracking code');
      toast.error('Please enter a tracking code', { duration: 4000 });
      return;
    }
    if (!validateTrackingCode(trackingCode)) {
      setError('Invalid tracking code format (e.g., TRK-SESSION-15-1747421013936)');
      toast.error('Invalid tracking code format', { duration: 4000 });
      return;
    }
    try {
      setError(null);
      setOrders([]);
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/track?trackingCode=${encodeURIComponent(trackingCode)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders);
      setShowTrackDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'track_order', { trackingCode });
      }
    } catch (err) {
      const errorMsg = err.message === 'Orders not found' ? 'Orders not found. Please check your tracking code.' : err.message;
      setError(errorMsg);
      toast.error(errorMsg, {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: () => formRef.current?.requestSubmit(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackAnother = () => {
    setTrackingCode('');
    setOrders([]);
    setShowTrackDialog(false);
    formRef.current?.focus();
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = (order) => {
    if (order.pharmacy && order.deliveryMethod === 'pickup') {
      return [{ name: order.pharmacy.name, address: order.pharmacy.address }];
    }
    return [];
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
          Track Your Order
        </h1>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mb-4">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-semibold text-primary">
              Enter Tracking Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form
              onSubmit={handleTrack}
              className="space-y-4"
              role="form"
              aria-labelledby="track-form-title"
              ref={formRef}
            >
              <div>
                <Label htmlFor="trackingCode" className="text-primary font-medium text-sm">
                  Tracking Code
                </Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="mt-1 text-sm"
                  placeholder="e.g., TRK-SESSION-15-1747421013936"
                  required
                  aria-required="true"
                  aria-describedby={error ? 'tracking-error' : undefined}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                disabled={loading}
                aria-label="Track order"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Tracking...
                  </>
                ) : (
                  'Track Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-3 mb-4" id="tracking-error" role="alert">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}
        {orders.length > 0 && (
          <>
            <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-primary">
                    Orders Found
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-foreground">
                    Found <span className="font-medium">{orders.length}</span> order{orders.length !== 1 ? 's' : ''} for tracking code{' '}
                    <span className="font-medium">{trackingCode}</span>.
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTrackAnother}
                    className="w-full sm:w-auto"
                    aria-label="Track another order"
                  >
                    Track Another
                  </Button>
                  <Button
                    onClick={() => setShowTrackDialog(false)}
                    className="w-full sm:w-auto"
                    aria-label="View order details"
                  >
                    View Details
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="space-y-4">
              {orders.map((order, index) => (
                <Card
                  key={order.id}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                  style={{ animation: 'fadeIn 0.5s ease-in', animationDelay: `${0.2 * index}s` }}
                >
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-xl font-semibold text-primary">
                      Order #{order.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3 text-foreground text-sm">
                      <p>
                        <strong>Tracking Code:</strong> {order.trackingCode || 'N/A'}
                      </p>
                      <p>
                        <strong>Customer:</strong> {order.patientIdentifier || 'N/A'}
                      </p>
                      <p>
                        <strong>Order Status:</strong> {order.status || 'Unknown'}
                      </p>
                      <p>
                        <strong>Payment Status:</strong> {order.paymentStatus || 'Pending'}
                      </p>
                      <p>
                        <strong>Order Placed:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {order.cancelledAt && (
                        <p>
                          <strong>Cancelled:</strong> {new Date(order.cancelledAt).toLocaleString()} {order.cancelReason ? `(${order.cancelReason})` : ''}
                        </p>
                      )}
                      <p>
                        <strong>Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                      </p>
                      {order.deliveryMethod === 'pickup' && getUniquePharmacyAddresses(order).length > 0 ? (
                        <div>
                          <strong>Pickup Address:</strong>
                          <div className="mt-1 space-y-1">
                            {getUniquePharmacyAddresses(order).map((pharmacy, index) => (
                              <p key={index} className="text-muted-foreground text-sm truncate">
                                {pharmacy.name}: {pharmacy.address}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>
                          <strong>Delivery Address:</strong> {order.address || 'Not specified'}
                        </p>
                      )}
                      {order.prescription && (
                        <div>
                          <h3 className="text-base font-semibold text-primary">Prescription Details</h3>
                          <p>
                            <strong>Prescription ID:</strong> {order.prescription.id || 'N/A'}
                          </p>
                          <p>
                            <strong>Status:</strong> {order.prescription.status || 'Pending'}
                          </p>
                          <p>
                            <strong>Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}
                          </p>
                          <p>
                            <strong>Uploaded:</strong> {order.prescription.createdAt ? new Date(order.prescription.createdAt).toLocaleString() : 'N/A'}
                          </p>
                          {order.prescription.medications?.length > 0 && (
                            <div>
                              <strong>Prescribed Medications:</strong>
                              <div className="mt-1 space-y-1">
                                {order.prescription.medications.map((med, index) => (
                                  <p key={index} className="text-muted-foreground text-sm truncate">
                                    {med.name} {med.genericName ? `(${med.genericName})` : ''} - Dosage: {med.dosage || 'N/A'}, Quantity: {med.quantity || 'N/A'}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <h3 className="text-base font-semibold text-primary">Order Items</h3>
                      {order.items?.map((item) => (
                        <div key={item.id} className="mb-3">
                          <p className="text-foreground text-sm font-medium truncate">
                            {item.medication.name} {item.medication.genericName ? `(${item.medication.genericName})` : ''} {item.medication.prescriptionRequired ? '(Prescription Required)' : ''}
                          </p>
                          {item.medication.dosage && (
                            <p className="text-muted-foreground text-sm">Dosage: {item.medication.dosage}</p>
                          )}
                          <p className="text-muted-foreground text-sm truncate">Pharmacy: {item.pharmacy.name}</p>
                          <p className="text-muted-foreground text-sm">Quantity: {item.quantity}</p>
                          <p className="text-muted-foreground text-sm">Unit Price: ₦{item.price.toLocaleString()}</p>
                          <p className="text-muted-foreground text-sm">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                        </div>
                      ))}
                      <p className="text-lg font-semibold text-primary text-right">
                        Total: ₦{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
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