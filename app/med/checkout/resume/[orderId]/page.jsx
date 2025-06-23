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
      toast.error('Guest ID not found', {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
    }
  }, []);

  const fetchCheckoutSessionId = async (guestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout/resume/${orderId}`, {
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
          console.error('Non-JSON response from /api/med-checkout/resume:', text);
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
      toast.error(err.message, {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
      console.error('fetchCheckoutSessionId error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (guestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout/resume-orders/${orderId}`, {
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
          console.error('Non-JSON response from /api/med-checkout/resume-orders:', text);
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
      toast.error(err.message, {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
      console.error('fetchOrders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout/resume/${orderId}`, {
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
          console.error('Non-JSON response from /api/med-checkout/resume POST:', text);
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
          router.push(`/med/confirmation?reference=${primaryReference}&session=${checkoutSessionId}`);
          toast.success('Payment successful!', {
            duration: 4000,
            style: {
              background: 'rgba(255,255,255,0.95)',
              color: '#225F91',
              border: '1px solid rgba(26,186,127,0.3)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 20px rgba(26,186,127,0.2)',
              padding: '1rem',
              backdropFilter: 'blur(8px)',
            },
          });
          window.gtag?.('event', 'order_payment_complete', { transactionId: transaction.reference });
        },
        onCancel: () => {
          setError('Payment cancelled');
          toast.error('Payment cancelled', {
            duration: 4000,
            style: {
              background: 'rgba(255,85,85,0.95)',
              color: '#ffffff',
              border: '1px solid rgba(34,95,145,0.3)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
              padding: '1rem',
              backdropFilter: 'blur(8px)',
            },
          });
        },
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message, {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
      console.error('handlePayment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!pharmacies.length && !error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80">
      <Loader2 className="h-10 w-10 text-[#225F91] animate-spin" />
    </div>
  );

  return (
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onError={() => toast.error('Failed to load Paystack', {
          duration: 4000,
          style: {
            background: 'rgba(255,85,85,0.95)',
            color: '#ffffff',
            border: '1px solid rgba(34,95,145,0.3)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
            padding: '1rem',
            backdropFilter: 'blur(8px)',
          },
        })}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
        <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
            Order Summary
          </h1>
          {error && (
            <Card className="bg-white/95 border border-[#225F91]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 mb-6 flex items-center gap-4 animate-in zoom-in-50 duration-500" role="alert">
              <AlertCircle className="h-6 w-6 text-[#225F91]" />
              <p className="text-[#225F91] text-base font-medium">{error}</p>
            </Card>
          )}
          {pharmacies.length > 0 && (
            <div className="space-y-6">
              {pharmacies.map((pharmacy) => (
                <Card key={pharmacy.pharmacy.id} className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in fade-in-20">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
                  <CardHeader className="bg-[#225F91]/10 p-6">
                    <CardTitle className="text-xl font-bold text-[#225F91]">{pharmacy.pharmacy.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm">{pharmacy.pharmacy.address}</p>
                    </div>
                    {pharmacy.orders.map((order) => (
                      <div key={order.id} className="mb-6">
                        <p className="text-sm font-semibold text-[#225F91]">Order #{order.id} | Status: {order.status}</p>
                        <table className="w-full text-sm mt-2 border-t border-[#1ABA7F]/20">
                          <thead>
                            <tr className="bg-[#225F91]/5">
                              <th className="p-2 text-left font-medium text-[#225F91]">Medication</th>
                              <th className="p-2 text-left font-medium text-[#225F91]">Qty</th>
                              <th className="p-2 text-left font-medium text-[#225F91]">Price</th>
                              <th className="p-2 text-left font-medium text-[#225F91]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-b border-[#1ABA7F]/10">
                                <td className="p-2 text-gray-900">{item.medication.name}</td>
                                <td className="p-2 text-gray-600">{item.quantity}</td>
                                <td className="p-2 text-gray-600">₦{item.price.toLocaleString()}</td>
                                <td className="p-2 text-gray-600">₦{(item.price * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-right text-sm font-semibold text-[#225F91] mt-2">Subtotal: ₦{order.totalPrice.toLocaleString()}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              {prescription && (
                <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in fade-in-20">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#1ABA7F]" />
                    <h3 className="text-lg font-semibold text-[#225F91]">Prescription</h3>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">ID: {prescription.id}</p>
                  <p className="text-gray-600 text-sm">Status: {prescription.status}</p>
                  <p className="text-gray-600 text-sm">Uploaded: {new Date(prescription.uploadedAt || Date.now()).toLocaleDateString()}</p>
                </Card>
              )}
              <div className="text-right">
                {totalPrice === 0 ? (
                  <Card className="bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-4 mb-4 flex items-center gap-4 animate-in zoom-in-50 duration-500">
                    <AlertCircle className="h-6 w-6 text-[#225F91]" />
                    <p className="text-sm font-medium text-[#225F91]">
                      No orders are ready for payment. Prescription may be pending verification or orders are already processed.
                    </p>
                  </Card>
                ) : (
                  <p className="text-xl font-bold text-[#225F91] mb-4">Total: ₦{totalPrice.toLocaleString()}</p>
                )}
                <Button
                  onClick={handlePayment}
                  className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
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