'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Home } from 'lucide-react';
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

  const fetchStatus = async (userId) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/${userId}`, {
        headers: { 'x-guest-id': userId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      const { prescriptionMetadata, medications } = data;
      // If prescription is verified and has medications, redirect to prescription medications page
      if (prescriptionMetadata.status === 'VERIFIED' && medications && medications.length > 0) {
        router.push(`/prescriptions/${userId}`);
        return;
      }
      // If prescription is pending, show status
      if ([ 'PENDING', 'PENDING_ADMIN', 'PENDING_ACTION' ].includes(prescriptionMetadata.status)) {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/retrieve`, {
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

  
  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />
      <div className="flex-1 py-12 px-5 sm:px-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Check Your Prescription Status
        </h1>
      <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-lg shadow-lg sm:p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="identifier" className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Email or Phone Number
                </Label>
                <Input
                  id="identifier"
                type="text"
                  value={form.identifier}
                  onChange={handleInputChange}
                placeholder="Enter your email or phone number"
                className="mt-4 h-12 text-sm font-medium rounded-lg border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                required
                />
              </div>
                <Button
                  type="submit"
              className="w-full sm:w-auto h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-lg bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(prescription.status) ? (
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
          </CardContent>
          </Card>
          <Button
        onClick={handleBackToHome}
        variant="outline"
        className="w-full sm:w-auto h-12 mt-6 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-lg border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10"
        aria-label="Go back to home page"
      >
        <Home className="h-4 w-4 sm:h-5 w-5 mr-2" />
        Back to Home
      </Button>
    </div>
    {/* Footer */}
    <footer className="bg-[#225F91]/95 text-white py-5 px-2 sm:px-4 mt-8 print:hidden">
      <div className="pt-2 border-white/20 text-center">
        <p className="text-xs sm:text-sm opacity-80">&copy; {new Date().getFullYear()} Manzu. Powered by WellRica.</p>
      </div>
    </footer>
  </div>
  );
}