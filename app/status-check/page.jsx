'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrder } from '@/hooks/useOrder';
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
  const { order, fetchOrder, guestId, prescriptionStatuses } = useOrder();
  const [form, setForm] = useState({ identifier: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = searchParams.get('patientIdentifier');
    const orderId = searchParams.get('orderId');
    if (id && orderId) {
      localStorage.setItem('guestId', id);
      fetchOrder();
    }
  }, [searchParams, fetchOrder]);

  const handleInputChange = (e) => setForm({ ...form, identifier: e.target.value });

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
      await fetchOrder();
      setStatus('success');
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
    setStatus('idle');
  };

  const getPrescriptionStatus = (item) => {
    const status = prescriptionStatuses[item.serviceId]?.status || 'none';
    return status === 'none' ? 'Not Required' : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Check Your Order Status
        </h1>

        {(status === 'idle' || status === 'error') && (
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

        {status === 'loading' && (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-pulse">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-12 w-12 text-[#225F91] animate-spin" aria-label="Loading order status" />
            </div>
            <div className="text-center text-gray-600">Fetching your order details...</div>
            <div className="mt-4 space-y-2">
              <div className="h-6 bg-gray-200/50 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200/50 rounded w-2/3 mx-auto"></div>
              <div className="h-4 bg-gray-200/50 rounded w-1/2 mx-auto"></div>
            </div>
          </Card>
        )}

        {status === 'success' && order && (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in zoom-in-50 duration-500">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <h2 className="text-2xl font-bold text-[#225F91] mb-4">Order #{order.orderId}</h2>
            <div className="p-4 border-b border-[#1ABA7F]/20">
              <p className="text-base font-semibold text-[#225F91]">
                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </p>
              <p className="text-base text-gray-600">
                Placed: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              {order.trackingCode && ['confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup'].includes(order.status) && (
                <p className="text-base text-gray-600">
                  Tracking Code: <span className="font-semibold">{order.trackingCode}</span>
                </p>
              )}
              {order.status === 'partially_completed' && (
                <p className="text-base text-gray-600">
                  Note: This order includes non-prescription items only. Prescription items are pending verification.
                </p>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-[#225F91] mb-2">Items</h3>
              {order.providers?.flatMap((provider) => provider.items).map((item) => (
                <div key={item.id} className="mb-4">
                  <p className="text-base font-medium text-gray-900">{item.service.displayName || item.service.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Price: ₦{(item.price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-gray-600">Prescription Status: {getPrescriptionStatus(item)}</p>
                </div>
              ))}
              <p className="text-lg font-bold text-[#225F91] mt-4">
                Total: ₦{(order.totalPrice / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              {order.trackingCode && (
                <Button
                  asChild
                  className="mt-4 h-10 px-4 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
                >
                  <Link href={`/med/track?trackingCode=${encodeURIComponent(order.trackingCode)}`}>Track Order</Link>
                </Button>
              )}
            </div>
            <div className="p-4 flex justify-between">
              <Button
                onClick={resetForm}
                variant="outline"
                className="h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
                aria-label="Check another order"
              >
                Check Another
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
              >
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}