'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Home, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
        const errorMsg = errorData.message === 'Orders not found or prescription still under review' ? (
          <>
            Orders not found or not ready for tracking. Please check your tracking code or{' '}
            <Link href="/status-check" className="text-blue-600 underline">check order status</Link>.
          </>
        ) : errorData.message;
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 6000,
          action: {
            label: 'Retry',
            onClick: () => formRef.current?.requestSubmit(),
          },
        });
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setOrders(data.orders);
      setShowTrackDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'track_order', { trackingCode });
      }
    } catch (err) {
      // Error already handled above
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

  const getStatusProgress = (status) => {
    const steps = ['confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup'];
    const index = steps.indexOf(status);
    return index >= 0 ? (index + 1) / steps.length * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Track Your Order
        </h1>
        <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6">
          <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
          <CardHeader className="bg-primary/10 p-6 sm:p-8">
            <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
              Enter Tracking Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleTrack} className="space-y-6" role="form" aria-labelledby="track-form-title" ref={formRef}>
              <div>
                <Label htmlFor="trackingCode" className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Tracking Code
                </Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                  placeholder="e.g., TRK-SESSION-15-1747421013936"
                  required
                  aria-required="true"
                  aria-describedby={error ? 'tracking-error' : undefined}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 px-8 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
                disabled={loading}
                aria-label="Track order"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Tracking...
                  </span>
                ) : (
                  'Track Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {error && (
          <Card className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500" id="tracking-error" role="alert">
            <p className="text-red-600 text-base font-medium">{error}</p>
            {error.includes('not ready for tracking') && (
              <p className="text-gray-600 text-sm mt-2">
                Try checking your order status with your email or phone number on the{' '}
                <Link href="/status-check" className="text-blue-600 underline">Status Check</Link> page.
              </p>
            )}
          </Card>
        )}
        {orders.length > 0 && (
          <>
            <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
              <DialogContent className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300">
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]" aria-hidden="true" />
                <DialogHeader>
                  <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
                    Order Details Found
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-base text-gray-600 text-center font-medium">
                    Found <span className="font-semibold text-gray-900">{orders.length}</span> order{orders.length !== 1 ? 's' : ''} for tracking code{' '}
                    <span className="font-semibold text-gray-900">{trackingCode}</span>.
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleTrackAnother}
                    className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                    aria-label="Track another order"
                  >
                    Track Another
                  </Button>
                  <Button
                    onClick={() => setShowTrackDialog(false)}
                    className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                    aria-label="View order details"
                  >
                    View Details
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="space-y-6">
              {orders.map((order, index) => (
                <Card
                  key={order.id}
                  className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] animate-in fade-in-20"
                  style={{ animationDelay: `${0.2 * index}s` }}
                >
                  <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
                  <CardHeader className="bg-primary/10 p-6 sm:p-8">
                    <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                      Order #{order.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${getStatusProgress(order.status)}%` }}></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-base font-medium">
                      <p>
                        <strong className="text-gray-900">Tracking Code:</strong> {order.trackingCode || 'N/A'}
                      </p>
                      <p>
                        <strong className="text-gray-900">Customer:</strong> {order.patientIdentifier || 'N/A'}
                      </p>
                      <p>
                        <strong className="text-gray-900">Order Status:</strong> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </p>
                      <p>
                        <strong className="text-gray-900">Payment Status:</strong> {order.paymentStatus || 'Pending'}
                      </p>
                      <p>
                        <strong className="text-gray-900">Order Placed:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {order.cancelledAt && (
                        <p>
                          <strong className="text-gray-900">Cancelled:</strong> {new Date(order.cancelledAt).toLocaleString()} {order.cancelReason ? `(${order.cancelReason})` : ''}
                        </p>
                      )}
                      <p>
                        <strong className="text-gray-900">Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                      </p>
                      {order.deliveryMethod === 'pickup' && getUniquePharmacyAddresses(order).length > 0 ? (
                        <div>
                          <strong className="text-gray-900">Pickup Address:</strong>
                          <div className="mt-1 space-y-1">
                            {getUniquePharmacyAddresses(order).map((pharmacy, index) => (
                              <p key={index} className="text-gray-600 truncate">
                                <span className="font-semibold">{pharmacy.name}</span>: {pharmacy.address}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>
                          <strong className="text-gray-900">Delivery Address:</strong> {order.address || 'Not specified'}
                        </p>
                      )}
                    </div>
                    {order.prescription && (
                      <div>
                        <h3 className="text-lg font-semibold text-primary mt-4">Prescription Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-sm font-medium mt-2">
                          <p>
                            <strong className="text-gray-900">Prescription ID:</strong> {order.prescription.id || 'N/A'}
                          </p>
                          <p>
                            <strong className="text-gray-900">Status:</strong> {order.prescription.status || 'Pending'}
                          </p>
                          <p>
                            <strong className="text-gray-900">Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}
                          </p>
                          <p>
                            <strong className="text-gray-900">Uploaded:</strong> {order.prescription.createdAt ? new Date(order.prescription.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        {order.prescription.medications?.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-gray-900 text-sm font-medium">Prescribed Medications:</strong>
                            <div className="mt-1 space-y-1">
                              {order.prescription.medications.map((med, index) => (
                                <p key={index} className="text-gray-600 text-sm truncate">
                                  {med.name} {med.genericName ? `(${med.genericName})` : ''} - Dosage: {med.dosage || 'N/A'}, Quantity: {med.quantity || 'N/A'}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-primary mt-4">Order Items</h3>
                    {order.items?.map((item) => (
                      <div key={item.id} className="mb-3 mt-2">
                        <p className="text-gray-900 text-base font-medium truncate">
                          {item.medication.name} {item.medication.genericName ? `(${item.medication.genericName})` : ''} {item.medication.prescriptionRequired ? '(Prescription Required)' : ''}
                        </p>
                        {item.medication.dosage && (
                          <p className="text-gray-600 text-sm font-medium">Dosage: {item.medication.dosage}</p>
                        )}
                        <p className="text-gray-600 text-sm font-medium truncate">Pharmacy: {item.pharmacy.name}</p>
                        <p className="text-gray-600 text-sm font-medium">Quantity: {item.quantity}</p>
                        <p className="text-gray-600 text-sm font-medium">Unit Price: ₦{item.price.toLocaleString()}</p>
                        <p className="text-gray-600 text-sm font-medium">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                      </div>
                    ))}
                    {order.status === 'cancelled' && (
                      <div className="mt-4 flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-base font-medium">
                          This order was cancelled. Contact <Link href="/support" className="text-blue-600 underline">support</Link> for assistance.
                        </p>
                      </div>
                    )}
                    <p className="text-xl font-extrabold text-primary text-right mt-2">
                      Total: ₦{order.totalPrice.toLocaleString()}
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