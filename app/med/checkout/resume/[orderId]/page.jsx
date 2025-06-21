'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetails() {
  const { orderId } = useParams();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState([]);
  const [trackingCode, setTrackingCode] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('guestId');
    if (id) {
      setPatientIdentifier(id);
      fetchCheckoutSessionId(id);
    } else {
      setError('Guest ID not found. Please check your status again.');
      toast.error('Guest ID not found', { duration: 4000 });
    }
  }, []);

  const fetchCheckoutSessionId = async (guestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/resume/${orderId}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to fetch session';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response from /api/checkout/resume:', text);
          errorMessage = 'Server returned an unexpected response';
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.checkoutSessionId) {
        throw new Error('Checkout session ID not found');
      }
      setCheckoutSessionId(data.checkoutSessionId);
      setTotalPrice(data.totalAmount || 0);
      setEmail(data.email || '');
      fetchOrders(guestId, data.checkoutSessionId);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      console.error('fetchCheckoutSessionId error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (guestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/resume-orders/${orderId}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to fetch orders';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response from /api/confirmation:', text);
          errorMessage = 'Server returned an unexpected response';
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.pharmacies || data.pharmacies.length === 0) {
        throw new Error('No orders found for this session');
      }
      setPharmacies(data.pharmacies);
      setTrackingCode(data.trackingCode || 'Pending');
      setPrescription(data.pharmacies[0]?.orders[0]?.prescription || null);
      if (!email) {
        setEmail(data.pharmacies[0]?.orders[0]?.email || 'user@example.com');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      console.error('fetchOrders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/resume/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': patientIdentifier,
        },
        body: JSON.stringify({ email: email || 'user@example.com' }),
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to initiate payment';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response from /api/checkout/resume POST:', text);
          errorMessage = 'Server returned an unexpected response';
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log('Resume checkout response:', data); // Debug log
      if (!data.paymentUrl || !data.transactionReference || !data.paymentReferences || !data.paymentReferences.length) {
        throw new Error('Payment URL, transaction reference, or payment references not provided');
      }

      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('PaystackPop not loaded');
      }

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email || 'user@example.com',
        amount: totalPrice * 100,
        ref: data.transactionReference,
        onSuccess: (transaction) => {
          const primaryReference = data.paymentReferences[0];
          router.push(`/confirmation?reference=${primaryReference}&session=${checkoutSessionId}`);
          toast.success('Payment successful!', { duration: 4000 });
          window.gtag?.('event', 'order_payment_complete', { transactionId: transaction.reference });
        },
        onCancel: () => {
          setError('Payment cancelled');
          toast.error('Payment cancelled', { duration: 4000 });
        },
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      console.error('handlePayment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!pharmacies.length && !error) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onError={() => toast.error('Failed to load Paystack', { duration: 4000 })}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
            Order Summary
          </h1>
          {error && (
            <Card className="bg-red-50/95 border border-red-100/400 rounded-2xl shadow-md mb-6 flex items-center gap-4 p-4 animate-in slide-in-from-top-10 duration-500" role="alert">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-600 text-base font-medium">{error}</p>
            </Card>
          )}
          {pharmacies.length > 0 && (
            <div className="space-y-6">
              {pharmacies.map((pharmacy) => (
                <Card key={pharmacy.pharmacy.id} className="shadow-xl border border-gray-200 rounded-2xl bg-white">
                  <div className="absolute top-0 left-0 w-12 h-12 bg-primary/10 rounded-br-full" />
                  <CardHeader className="bg-gray-50 p-6">
                    <CardTitle className="text-xl font-bold text-gray-800">{pharmacy.pharmacy.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm">{pharmacy.pharmacy.address}</p>
                    </div>
                    {pharmacy.orders.map((order) => (
                      <div key={order.id} className="mb-6">
                        <p className="text-sm font-semibold">Order #{order.id} | Status: {order.status}</p>
                        <table className="w-full text-sm mt-2 border-t border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="p-2 text-left font-medium">Medication</th>
                              <th className="p-2 text-left font-medium">Qty</th>
                              <th className="p-2 text-left font-medium">Price</th>
                              <th className="p-2 text-left font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="p-2">{item.medication.name}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">₦{item.price.toLocaleString()}</td>
                                <td className="p-2">₦{(item.price * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-right text-sm font-semibold text-gray-700 mt-2">Subtotal: ₦{order.totalPrice.toLocaleString()}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              {prescription && (
                <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white p-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-gray-800">Prescription</h3>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">ID: {prescription.id}</p>
                  <p className="text-gray-600 text-sm">Status: {prescription.status}</p>
                  <p className="text-gray-600 text-sm">Uploaded: {new Date(prescription.uploadedAt || Date.now()).toLocaleDateString()}</p>
                </Card>
              )}
              <div className="text-right">
                {totalPrice === 0 ? (
                  <Card className="bg-yellow-50 text-yellow-600 rounded-2xl shadow-md p-4 mb-4 flex items-center gap-4">
                    <AlertCircle className="h-6 w-6" />
                    <p className="text-sm font-medium">
                      No orders are ready for payment. Prescription may be pending verification or orders are already processed.
                    </p>
                  </Card>
                ) : (
                  <p className="text-xl font-bold text-primary mb-4">Total: ₦{totalPrice.toLocaleString()}</p>
                )}
                <Button
                  onClick={handlePayment}
                  className="h-12 px-6 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors duration-200"
                  disabled={loading || totalPrice === 0 || pharmacies.some(p => p.orders.some(o => o.status !== 'pending'))}
                  aria-label="Complete payment"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Pay All'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}