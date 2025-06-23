'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ConfirmationInner() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');

  const validateQueryParams = () => {
    if (!guestId) return 'Missing guest ID';
    if (!session) return 'Missing session ID';
    return null;
  };

  const fetchConfirmation = async () => {
    const validationError = validateQueryParams();
    if (validationError) {
      setError(validationError);
      toast.error(validationError, { duration: 4000 });
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const query = new URLSearchParams();
      query.append('session', session);
      if (reference) query.append('reference', reference);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-confirmation?${query.toString()}`, {
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
      toast.success('Order confirmed! You’ll receive an email with your tracking code.', {
        duration: 6000,
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
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'order_confirmed', {
          trackingCode: data.trackingCode,
          orderIds: data.pharmacies.flatMap(p => p.orders.map(o => o.id)).join(','),
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          borderRadius: '0.5rem',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guestId && session) {
      fetchConfirmation();
    } else {
      setError('Missing guest ID or session ID');
      toast.error('Missing guest ID or session ID', {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          borderRadius: '0.5rem',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
      setLoading(false);
    }
  }, [reference, session]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const handleBackToHome = () => {
    router.push('/med');
  };

  const handleTrackOrder = () => {
    if (confirmationData.trackingCode) {
      router.push(`/med/track?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
    } else {
      toast.error('Tracking code not available.', {
        duration: 4000,
        style: {
          background: 'rgba(255,85,85,0.95)',
          color: '#ffffff',
          border: '1px solid rgba(34,95,145,0.3)',
          boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
          borderRadius: '0.5rem',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80">
        <Loader2 className="h-10 w-10 text-[#225F91] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="bg-white/95 border border-[#225F91]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 animate-in zoom-in-50 duration-500">
            <p className="text-[#225F91] text-base font-medium">{error}</p>
            <Button
              asChild
              variant="outline"
              className="mt-4 h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
            >
              <Link href="/med/status-check">Check Status</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Order Confirmed!
        </h1>
        <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30">
          <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
          <CardHeader className="bg-[#225F91]/10 p-6 sm:p-8">
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91] flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
              Thank You for Your Order!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-base font-medium">
              <p>
                <strong className="text-gray-900">Tracking Code:</strong> {confirmationData.trackingCode}
              </p>
              <p>
                <strong className="text-gray-900">Total:</strong> ₦{confirmationData.pharmacies.reduce((sum, p) => sum + p.subtotal, 0).toLocaleString()}
              </p>
            </div>
            {confirmationData.pharmacies.map((pharmacy, index) => (
              <div key={pharmacy.pharmacy.id} className="border-t border-[#1ABA7F]/20 pt-4">
                <h3 className="text-lg font-semibold text-[#225F91]">{pharmacy.pharmacy.name}</h3>
                <p className="text-gray-600 text-sm">{pharmacy.pharmacy.address}</p>
                {pharmacy.orders.map((order) => (
                  <div key={order.id} className="mt-4">
                    <p className="text-sm font-semibold text-[#225F91]">Order #{order.id} | Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                    {order.items.map((item) => (
                      <div key={item.id} className="mt-2">
                        <p className="text-gray-900 text-sm font-medium">{item.medication.name}</p>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                        <p className="text-gray-600 text-sm">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                      </div>
                    ))}
                    <p className="text-gray-900 text-base font-semibold mt-2">Order Total: ₦{order.totalPrice.toLocaleString()}</p>
                  </div>
                ))}
                <p className="text-lg font-bold text-[#225F91] mt-4">Subtotal: ₦{pharmacy.subtotal.toLocaleString()}</p>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button
                onClick={handleTrackOrder}
                className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
                disabled={!confirmationData.trackingCode}
                aria-label="Track order"
              >
                Track Order
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
                aria-label="Back to home"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}