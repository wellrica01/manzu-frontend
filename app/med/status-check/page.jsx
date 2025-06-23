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
  const [prescription, setPrescription] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState(null);

  useEffect(() => {
    const id = searchParams.get('patientIdentifier');
    const orderId = searchParams.get('orderId');
    if (id) {
      setPatientIdentifier(id);
      fetchStatus(id, orderId);
    }
  }, [searchParams]);

  const handleInputChange = (e) => setForm({ ...form, identifier: e.target.value });

  const fetchStatus = async (patientId, orderId) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/guest-med/${patientId}`, {
        headers: { 'x-guest-id': patientId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      console.log('Prescription API response:', data);
      const { prescriptionMetadata, orderId: fetchedOrderId, orderStatus, medications } = data;

      // Ensure loading UI renders before any redirection
      await new Promise(resolve => setTimeout(resolve, 300));

      if (['pending', 'pending_admin', 'pending_action'].includes(prescriptionMetadata.status)) {
        setPrescription({ ...prescriptionMetadata, order: fetchedOrderId ? { id: fetchedOrderId } : null });
        setStatus('success');
        toast.info('Your prescription is under review. You’ll be notified when it’s ready.', {
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
        return;
      }

      if (fetchedOrderId) {
        const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout/resume/${fetchedOrderId}`, {
          headers: { 'x-guest-id': patientId },
        });
        console.log('Order API response:', { status: orderResponse.status, ok: orderResponse.ok });
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          console.log('Order API error:', errorData);
          throw new Error(errorData.message || 'Failed to fetch order details');
        }
        const orderData = await orderResponse.json();
        const { checkoutSessionId, trackingCode } = orderData;

        // Ensure loading UI renders before redirection
        await new Promise(resolve => setTimeout(resolve, 300));

        switch (orderStatus) {
          case 'pending':
            router.push(`/med/checkout/resume/${fetchedOrderId}`);
            break;
          case 'pending_prescription':
            setPrescription({ ...prescriptionMetadata, order: { id: fetchedOrderId } });
            setStatus('success');
            toast.info('Your prescription is under review for this order. You’ll be notified when it’s ready.', {
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
            break;
          case 'confirmed':
          case 'processing':
          case 'shipped':
          case 'delivered':
          case 'ready_for_pickup':
            setPrescription({
              ...prescriptionMetadata,
              order: { id: fetchedOrderId, trackingCode, checkoutSessionId },
              status: orderStatus,
            });
            setStatus('success');
            toast.success(`Order ${orderStatus}. Track your order with code: ${trackingCode}`, {
              duration: 6000,
              action: {
                label: 'Track Now',
                onClick: () => router.push(`/med/track?trackingCode=${encodeURIComponent(trackingCode)}`),
              },
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
            break;
          case 'cancelled':
            setPrescription({ ...prescriptionMetadata, order: { id: fetchedOrderId }, status: 'cancelled' });
            setStatus('success');
            toast.error('Your order has been cancelled. Please contact support or start a new order.', {
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
            break;
          default:
            throw new Error(`Unknown order status: ${orderStatus}`);
        }
      } else if (prescriptionMetadata.status === 'verified') {
        if (medications.some(med => med.availability?.length && med.availability[0].price > 0)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push(`/med/guest-med/${patientId}`);
        } else {
          setPrescription({ ...prescriptionMetadata });
          setStatus('success');
          toast.info('No medications available for this prescription. Please contact support or start a new order.', {
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
        }
      } else {
        throw new Error('Invalid prescription status');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
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
      setPrescription(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout/session/retrieve`, {
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
    }
  };

  const resetForm = () => {
    setForm({ identifier: '' });
    setError(null);
    setPrescription(null);
    setPatientIdentifier(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Check Your Prescription Status
        </h1>

        {/* Form Section */}
        {(status === 'idle' || status === 'error' || (status === 'loading' && !patientIdentifier)) && (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 mb-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in zoom-in-50 duration-500">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <h2 className="text-2xl font-bold text-[#225F91] mb-4 text-center">Enter Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                  Email or Phone
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleInputChange}
                  className="mt-2 h-12 text-lg font-medium rounded-2xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                  placeholder="Enter email or phone number"
                  required
                  aria-required="true"
                  disabled={status === 'loading'}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[#225F91]">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">{error}</p>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
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
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-pulse">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-12 w-12 text-[#225F91] animate-spin" aria-label="Loading prescription status" />
            </div>
            <div className="text-center text-gray-600">Fetching your prescription details...</div>
            {/* Skeleton UI */}
            <div className="mt-4 space-y-2">
              <div className="h-6 bg-gray-200/50 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200/50 rounded w-2/3 mx-auto"></div>
              <div className="h-4 bg-gray-200/50 rounded w-1/2 mx-auto"></div>
            </div>
          </Card>
        )}

        {/* Prescription Section */}
        {status === 'success' && prescription && (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in zoom-in-50 duration-500">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <h2 className="text-2xl font-bold text-[#225F91] mb-4">Your Prescription</h2>
            <div className="p-4 border-b border-[#1ABA7F]/20">
              <p className="text-base font-semibold text-[#225F91]">
                Prescription #{prescription.id} | Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-base text-gray-600">
                Status:{' '}
                {prescription.status === 'pending'
                  ? 'Under Review'
                  : prescription.status === 'verified'
                  ? 'Verified'
                  : prescription.status === 'cancelled'
                  ? 'Cancelled'
                  : prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
              </p>
              {prescription.order && prescription.status === 'verified' && prescription.order.status === 'pending' && (
                <Button
                  asChild
                  className="mt-2 h-10 px-4 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
                >
                  <Link href={`/order/${prescription.order.id}`}>View Order</Link>
                </Button>
              )}
              {prescription.status === 'cancelled' && (
                <div className="mt-4 flex items-center gap-2 text-[#225F91]">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">
                    This order was cancelled. Contact{' '}
                    <Link href="/support" className="text-[#225F91] underline">
                      support
                    </Link>{' '}
                    for assistance.
                  </p>
                </div>
              )}
              {prescription.order && prescription.status === 'pending' && (
                <div className="mt-4 flex items-center gap-2 text-[#1ABA7F]">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">Your order is waiting for prescription verification.</p>
                </div>
              )}
              {prescription.order?.trackingCode &&
                ['confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup'].includes(prescription.status) && (
                  <div className="mt-4 flex items-center gap-2 text-[#225F91]">
                    <CheckCircle className="h-5 w-5 text-[#1ABA7F]" />
                    <p className="text-base font-medium">
                      Order {prescription.status}. Track your order with code:{' '}
                      <span className="font-semibold">{prescription.order.trackingCode}</span>.{' '}
                      <Link
                        href={`/med/track?trackingCode=${encodeURIComponent(prescription.order.trackingCode)}`}
                        className="text-[#225F91] underline"
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
                className="h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
                aria-label="Check another prescription"
              >
                Check Another
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
              >
                <Link href="/prescriptions">View All Prescriptions</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}