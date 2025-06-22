'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ConfirmationInner() {
  const [confirmationData, setConfirmationData] = useState({ labs: [], trackingCode: '', checkoutSessionId: '' });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/confirmation?${query.toString()}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify booking');
      }
      const data = await response.json();
      setConfirmationData({
        labs: data.labs,
        trackingCode: data.trackingCode,
        checkoutSessionId: data.checkoutSessionId,
      });
      toast.success('Booking confirmed! You’ll receive an email with your tracking code.', { duration: 6000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'booking_confirmed', {
          trackingCode: data.trackingCode,
          bookingIds: data.labs.flatMap(l => l.bookings.map(b => b.id)).join(','),
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
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
      toast.error('Missing guest ID or session ID', { duration: 4000 });
      setLoading(false);
    }
  }, [reference, session]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleTrackBooking = () => {
    if (confirmationData.trackingCode) {
      router.push(`/track?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
    } else {
      toast.error('Tracking code not available.', { duration: 4000 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50/95 to-gray-100/95">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4">
            <p className="text-red-600 text-base font-medium">{error}</p>
            <Button
              asChild
              variant="outline"
              className="mt-4 h-10 px-4 rounded-full border-primary text-primary hover:bg-primary/10"
            >
              <Link href="/status-check">Check Status</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Booking Confirmed!
        </h1>
        <Card className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md">
          <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
          <CardHeader className="bg-primary/10 p-6 sm:p-8">
            <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Thank You for Your Booking!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-base font-medium">
              <p>
                <strong className="text-gray-900">Tracking Code:</strong> {confirmationData.trackingCode}
              </p>
              <p>
                <strong className="text-gray-900">Total:</strong> ₦{confirmationData.labs.reduce((sum, l) => sum + l.subtotal, 0).toLocaleString()}
              </p>
            </div>
            {confirmationData.labs.map((lab, index) => (
              <div key={lab.lab.id} className="border-t border-gray-200/50 pt-4">
                <h3 className="text-lg font-semibold text-primary">{lab.lab.name}</h3>
                <p className="text-gray-600 text-sm">{lab.lab.address}</p>
                {lab.bookings.map((booking) => (
                  <div key={booking.id} className="mt-4">
                    <p className="text-sm font-semibold">Booking #{booking.id} | Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</p>
                    {booking.items.map((item) => (
                      <div key={item.id} className="mt-2">
                        <p className="text-gray-900 text-sm font-medium">{item.test.name}</p>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                        <p className="text-gray-600 text-sm">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                      </div>
                    ))}
                    <p className="text-gray-900 text-base font-semibold mt-2">Booking Total: ₦{booking.totalPrice.toLocaleString()}</p>
                  </div>
                ))}
                <p className="text-lg font-extrabold text-primary mt-4">Subtotal: ₦{lab.subtotal.toLocaleString()}</p>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button
                onClick={handleTrackBooking}
                className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"
                disabled={!confirmationData.trackingCode}
                aria-label="Track booking"
              >
                Track Booking
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50"
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