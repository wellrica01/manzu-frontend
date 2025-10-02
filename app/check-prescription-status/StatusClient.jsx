'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Home, Search, Clock, FileText, Sparkles } from 'lucide-react';
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
      
      if (prescriptionMetadata.status === 'VERIFIED' && medications && medications.length > 0) {
        router.push(`/prescriptions/${userId}`);
        return;
      }
      
      if (['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(prescriptionMetadata.status)) {
        setPrescription(prescriptionMetadata);
        setStatus('success');
        toast.info('Your prescription is under review. You will be notified when it is ready.', {
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
      
      setPrescription(prescriptionMetadata);
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
    setuserIdentifier(null);
    setStatus('idle');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20">
              <Loader2 className="w-20 h-20 text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-full border-t-4 border-[#225F91] animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
              Checking Status
            </h2>
            <p className="text-gray-600 font-medium">Please wait while we retrieve your prescription details...</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex-1 py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
            Check Prescription Status
          </h1>
          <p className="text-base text-gray-600 font-medium max-w-2xl mx-auto">
            Enter your email or phone number to view your prescription status and order details
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Status Check Form */}
          {status === 'idle' && (
            <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

              <CardHeader className="relative z-10 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-8">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
                    <Search className="h-6 w-6 text-[#225F91]" />
                  </div>
                  <CardTitle className="text-2xl font-black text-[#225F91]">
                    Check Your Status
                  </CardTitle>
                </div>
                <p className="text-center text-gray-600 text-sm">
                  Track your prescription verification and order progress
                </p>
              </CardHeader>

              <CardContent className="relative z-10 p-8 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="identifier" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Email or Phone Number
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      value={form.identifier}
                      onChange={handleInputChange}
                      className="h-14 text-base font-medium rounded-xl border-2 border-gray-300 focus:border-[#1ABA7F] focus:ring-4 focus:ring-[#1ABA7F]/20 transition-all duration-300"
                      placeholder="e.g., your@email.com or +234..."
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Use the same contact info you provided during checkout
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-14 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-70"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      Check Status
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </Button>
                </form>

                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="w-full h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success State - Prescription Under Review */}
          {status === 'success' && prescription && ['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(prescription.status) && (
            <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full" />
              
              <CardHeader className="relative z-10 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-8 text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <Clock className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>

                <CardTitle className="space-y-2">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
                    Under Review
                  </h2>
                  <p className="text-lg text-gray-600 font-semibold">Your prescription is being verified</p>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200/50">
                  <div className="flex items-start gap-3">
                    <FileText className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 text-lg">What's Happening?</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Our pharmacy team is carefully reviewing your prescription to ensure accuracy and safety. 
                        This process typically takes a few hours, but may vary depending on the complexity of your prescription.
                      </p>
                    </div>
                  </div>
                </div>

                {prescription.id && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Prescription ID</p>
                      <p className="text-sm font-bold text-gray-900">{prescription.id}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <p className="text-sm font-bold text-orange-600">{prescription.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10 font-bold rounded-xl transition-all duration-300"
                  >
                    Check Another
                  </Button>
                  <Button
                    onClick={handleBackToHome}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State - No Medications */}
          {status === 'success' && prescription && !['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(prescription.status) && (
            <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-yellow-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-full" />
              
              <CardHeader className="relative z-10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-8 text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                <CardTitle className="space-y-2">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    Action Required
                  </h2>
                  <p className="text-lg text-gray-600 font-semibold">No medications available</p>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200/50">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    We couldn't find any medications associated with this prescription. This could mean your 
                    prescription is still being processed or there may be an issue that needs attention.
                  </p>
                </div>

                <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200/50">
                  <h3 className="font-bold text-gray-900 mb-2">What should I do?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span>Contact our support team for assistance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span>Or start a new order if needed</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="flex-1 h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/support">Contact Support</Link>
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
                  >
                    Check Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {status === 'error' && (
            <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/20 to-transparent rounded-bl-full" />
              
              <CardHeader className="relative z-10 bg-gradient-to-r from-red-500/10 to-pink-500/10 p-8 text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                <CardTitle className="space-y-2">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
                    Not Found
                  </h2>
                  <p className="text-lg text-gray-600 font-semibold">We couldn't find your prescription</p>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200/50">
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {error}
                  </p>
                  <p className="text-xs text-gray-600">
                    Please verify your contact information and try again, or contact support if the issue persists.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={resetForm}
                    className="flex-1 h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleBackToHome}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-12">
        <div className="text-center">
          <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Manzu. Powered by WellRica.</p>
        </div>
      </footer>
    </div>
  );
}