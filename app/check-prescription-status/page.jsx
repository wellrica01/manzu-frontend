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
  const [userIdentifier, setuserIdentifier] = useState(null);

  useEffect(() => {
    const id = searchParams.get('userIdentifier');
    if (id) {
      setuserIdentifier(id);
      fetchStatus(id);
    }
  }, [searchParams]);

  const handleInputChange = (e) => setForm({ ...form, identifier: e.target.value });

  const fetchStatus = async (patientId) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/prescriptions/${patientId}`, {
        headers: { 'x-guest-id': patientId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      const { prescriptionMetadata, medications } = data;
      // If prescription is verified and has medications, redirect to prescription medications page
      if (prescriptionMetadata.status === 'verified' && medications && medications.length > 0) {
        router.push(`/prescriptions/${patientId}`);
        return;
      }
      // If prescription is pending, show status
      if ([ 'pending', 'pending_admin', 'pending_action' ].includes(prescriptionMetadata.status)) {
        setPrescription(prescriptionMetadata);
        setStatus('success');
        toast.info('Your prescription is under review. You’ll be notified when it’s ready.', {
          duration: 4000,
        });
        return;
      }
      // If no medications or other status
      setPrescription(prescriptionMetadata);
          setStatus('success');
          toast.info('No medications available for this prescription. Please contact support or start a new order.', {
            duration: 4000,
      });
    } catch (err) {
      setError(err.message);
      setStatus('error');
      toast.error(err.message, {
        duration: 4000,
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
      setuserIdentifier(guestId);
      await fetchStatus(guestId);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      toast.error(err.message, {
        duration: 4000,
      });
    }
  };

  const resetForm = () => {
    setForm({ identifier: '' });
    setError(null);
    setPrescription(null);
    setuserIdentifier(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Check Your Prescription Status
        </h1>
        <Card className="max-w-xl mx-auto p-8 shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="identifier" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Email or Phone Number
                </Label>
                <Input
                  id="identifier"
                type="text"
                  value={form.identifier}
                  onChange={handleInputChange}
                placeholder="Enter your email or phone number"
                className="h-12 text-base font-medium rounded-xl border bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                  required
                />
              </div>
                <Button
                  type="submit"
              className="w-full h-12 px-6 text-base font-semibold rounded-xl bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-6 w-6" />
                      Checking...
                </span>
                  ) : (
                    'Check Status'
                  )}
                </Button>
            </form>
        {status === 'success' && prescription && (
            <div className="mt-8 text-center">
              {['pending', 'pending_admin', 'pending_action'].includes(prescription.status) ? (
                <>
                  <CheckCircle className="h-10 w-10 text-[#1ABA7F] mx-auto mb-2" />
                  <p className="text-lg font-semibold text-[#225F91] mb-2">Your prescription is under review.</p>
                  <p className="text-base text-gray-600 mb-4">You’ll be notified when it’s ready to order.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-[#225F91] mb-2">No medications available for this prescription.</p>
                  <p className="text-base text-gray-600 mb-4">Please contact support or start a new order.</p>
                </>
              )}
              <Button variant="outline" onClick={resetForm} className="mt-4">Check Another</Button>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-8 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-red-600 mb-2">Error</p>
              <p className="text-base text-gray-600 mb-4">{error}</p>
              <Button variant="outline" onClick={resetForm} className="mt-4">Try Again</Button>
            </div>
          )}
          </Card>
      </div>
    </div>
  );
}