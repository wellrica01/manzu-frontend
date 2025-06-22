'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StatusCheck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ identifier: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);
  const [testOrder, setTestOrder] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState(null);

  useEffect(() => {
    const id = searchParams.get('patientIdentifier');
    const bookingId = searchParams.get('bookingId');
    if (id) {
      setPatientIdentifier(id);
      fetchStatus(id, bookingId);
    }
  }, [searchParams]);

  const handleInputChange = (e) => setForm({ ...form, identifier: e.target.value });

  const fetchStatus = async (patientId, bookingId) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-order/guest-test/${patientId}`, {
        headers: { 'x-guest-id': patientId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      console.log('Test Order API response:', data);
      const { testOrderMetadata, bookingId: fetchedBookingId, bookingStatus, tests } = data;

      // Ensure loading UI renders before any redirection
      await new Promise(resolve => setTimeout(resolve, 300));

      if (['pending', 'pending_admin', 'pending_action'].includes(testOrderMetadata.status)) {
        setTestOrder({ ...testOrderMetadata, booking: fetchedBookingId ? { id: fetchedBookingId } : null });
        setStatus('success');
        toast.info('Your test order is under review. You’ll be notified when it’s ready.', { duration: 4000 });
        return;
      }

      if (fetchedBookingId) {
        const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-checkout/resume/${fetchedBookingId}`, {
          headers: { 'x-guest-id': patientId },
        });
        console.log('Booking API response:', { status: bookingResponse.status, ok: bookingResponse.ok });
        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json();
          console.log('Booking API error:', errorData);
          throw new Error(errorData.message || 'Failed to fetch booking details');
        }
        const bookingData = await bookingResponse.json();
        const { checkoutSessionId, trackingCode } = bookingData;

        // Ensure loading UI renders before redirection
        await new Promise(resolve => setTimeout(resolve, 300));

        switch (bookingStatus) {
          case 'pending':
            router.push(`/test/checkout/resume/${fetchedBookingId}`);
            break;
          case 'pending_test_order':
            setTestOrder({ ...testOrderMetadata, booking: { id: fetchedBookingId } });
            setStatus('success');
            toast.info('Your test order is under review for this booking. You’ll be notified when it’s ready.', { duration: 4000 });
            break;
          case 'confirmed':
          case 'processing':
          case 'scheduled':
          case 'completed':
            setTestOrder({
              ...testOrderMetadata,
              booking: { id: fetchedBookingId, trackingCode, checkoutSessionId },
              status: bookingStatus,
            });
            setStatus('success');
            toast.success(`Booking ${bookingStatus}. Track your booking with code: ${trackingCode}`, {
              duration: 6000,
              action: {
                label: 'Track Now',
                onClick: () => router.push(`/test/track?trackingCode=${encodeURIComponent(trackingCode)}`),
              },
            });
            break;
          case 'cancelled':
            setTestOrder({ ...testOrderMetadata, booking: { id: fetchedBookingId }, status: 'cancelled' });
            setStatus('success');
            toast.error('Your booking has been cancelled. Please contact support or start a new booking.', { duration: 4000 });
            break;
          default:
            throw new Error(`Unknown booking status: ${bookingStatus}`);
        }
      } else if (testOrderMetadata.status === 'verified') {
        if (tests.some(test => test.availability?.length && test.availability[0].price > 0)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push(`/test/guest-test/${patientId}`);
        } else {
          setTestOrder({ ...testOrderMetadata });
          setStatus('success');
          toast.info('No tests available for this test order. Please contact support or start a new test order.', { duration: 4000 });
        }
      } else {
        throw new Error('Invalid test order status');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
      toast.error(err.message, { duration: 4000 });
      setTestOrder(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-checkout/session/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': localStorage.getItem('guestId') || '',
        },
        body: JSON.stringify({
          email: form.identifier.includes('@') ? form.identifier : undefined,
          phone: !form.identifier.includes('@') ? form.identifier : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retrieve session');
      }
      const { guestId } = await response.json();
      localStorage.setItem('guestId', guestId);
      setPatientIdentifier(guestId);
      await fetchStatus(guestId);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      toast.error(err.message, { duration: 4000 });
    }
  };

  const resetForm = () => {
    setForm({ identifier: '' });
    setError(null);
    setTestOrder(null);
    setPatientIdentifier(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Check Your LabRequest Status
        </h1>

        {/* Form Section */}
        {(status === 'idle' || status === 'error' || (status === 'loading' && !patientIdentifier)) && (
          <Card className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md p-6 mb-6 transition-opacity duration-300">
            <h2 className="text-2xl font-extrabold text-primary mb-4 text-center">Enter Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Email or Phone
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleInputChange}
                  className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  placeholder="Enter email or phone number"
                  required
                  aria-required="true"
                  disabled={status === 'loading'}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">{error}</p>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
                  disabled={status === 'loading'}
                  aria-label="Check status"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Loading Section */}
        {status === 'loading' && patientIdentifier && (
          <Card className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md p-6 transition-opacity duration-300 animate-pulse">
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-12 w-12 text-primary animate-spin" aria-label="Loading test order status" />
            </div>
            <div className="text-center text-gray-600">Fetching your test order details...</div>
            {/* Skeleton UI */}
            <div className="mt-4 space-y-2">
              <div className="h-6 bg-gray-200/50 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200/50 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200/50 rounded w-1/2"></div>
            </div>
          </Card>
        )}

        {/* Test Order Section */}
        {status === 'success' && testOrder && (
          <Card className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md p-6 transition-opacity duration-300">
            <h2 className="text-2xl font-extrabold text-primary mb-4">Your Test Order</h2>
            <div className="p-4 border-b border-gray-100/50">
              <p className="text-base font-semibold">
                Test Order #{testOrder.id} | Uploaded: {new Date(testOrder.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-base text-gray-600">
                Status:{' '}
                {testOrder.status === 'pending'
                  ? 'Under Review'
                  : testOrder.status === 'verified'
                  ? 'Verified'
                  : testOrder.status === 'cancelled'
                  ? 'Cancelled'
                  : testOrder.status.charAt(0).toUpperCase() + testOrder.status.slice(1)}
              </p>
              {testOrder.booking && testOrder.status === 'verified' && testOrder.booking.status === 'pending' && (
                <Button
                  asChild
                  className="mt-2 h-10 px-4 rounded-full bg-primary text-white hover:bg-primary/90"
                >
                  <Link href={`/booking/${testOrder.booking.id}`}>View Booking</Link>
                </Button>
              )}
              {testOrder.status === 'cancelled' && (
                <div className="mt-4 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">
                    This booking was cancelled. Contact{' '}
                    <Link href="/support" className="text-blue-600 underline">
                      support
                    </Link>{' '}
                    for assistance.
                  </p>
                </div>
              )}
              {testOrder.booking && testOrder.status === 'pending' && (
                <div className="mt-4 flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">Your booking is waiting for test order verification.</p>
                </div>
              )}
              {testOrder.booking?.trackingCode &&
                ['confirmed', 'processing', 'scheduled', 'completed'].includes(testOrder.status) && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-base font-medium">
                      Booking {testOrder.status}. Track your booking with code:{' '}
                      <span className="font-semibold">{testOrder.booking.trackingCode}</span>.{' '}
                      <Link
                        href={`/test/track?trackingCode=${encodeURIComponent(testOrder.booking.trackingCode)}`}
                        className="text-blue-600 underline"
                      >
                        Track Now
                      </Link>
                    </p>
                  </div>
                )}
            </div>
            <div className="p-4 flex justify-between">
              <Button
                onClick={resetForm}
                variant="outline"
                className="h-10 px-4 rounded-full border-primary text-primary hover:bg-primary/10"
                aria-label="Check another test order"
              >
                Check Another
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 px-4 rounded-full border-primary text-primary hover:bg-primary/10"
              >
                <Link href="/test-orders">View All Test Orders</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}