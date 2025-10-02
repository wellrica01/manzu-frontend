'use client';

import { QRCode } from 'react-qrcode-logo';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, Store, Package, CheckCircle, MapPin, Printer, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Confetti from 'react-dom-confetti';

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 200,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  colors: ["#1ABA7F", "#225F91", "#76D1F3", "#FFD700", "#FF6B6B"]
};

export default function ConfirmationInner() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [guestId, setGuestId] = useState(null);
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');


  useEffect(() => {
    const id = localStorage.getItem('guestId');
    setGuestId(id);
  }, []);


useEffect(() => {
  // Guard clause: exit early if no guestId or session
  if (!guestId || !session) {
    if (guestId !== null) { // Only show error after we've checked localStorage
      setError('Missing guest ID or session ID');
      toast.error('Missing guest ID or session ID', { duration: 4000 });
    }
    setLoading(false);
    return;
  }

  const fetchConfirmation = async () => {
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
      
      toast.success('Order confirmed! You will receive an email with your tracking code.', { duration: 6000 });
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'order_confirmed', {
          trackingCode: data.trackingCode,
          orderIds: data.pharmacies.flatMap(p => p.orders.map(o => o.id)).join(','),
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  fetchConfirmation();
}, [guestId, session, reference]);

  useEffect(() => {
    if (!loading && !error) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [loading, error]);

  const handleBackToHome = () => router.push('/');
  const handleTrackOrder = () => {
    if (confirmationData.trackingCode) {
      router.push(`/track-order?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
    } else {
      toast.error('Tracking code not available.', { duration: 4000 });
    }
  };

  if (loading) {
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

          <div role="status" aria-live="polite" className="text-center space-y-3">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
              Confirming Your Order
            </h2>
            <p className="text-gray-600 font-medium">Please wait while we process your payment...</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden py-8 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-8">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-center space-y-2">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                  Order Confirmation Failed
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200/50">
                <p className="text-red-800 text-base font-medium">{error}</p>
              </div>
              <Button
                asChild
                className="w-full h-14 bg-gradient-to-r from-[#225F91] to-[#1ABA7F] hover:from-[#1ABA7F] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/status-check">Check Order Status</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDelivery = confirmationData.pharmacies.some(pharmacy => pharmacy.orders.some(order => order.deliveryMethod === 'COURIER'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Confetti */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none print:hidden">
        <Confetti active={showConfetti} config={confettiConfig} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 px-4">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Success Header Card */}
          <Card className="relative bg-white/95 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-700">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

            <CardHeader className="relative z-10 bg-gradient-to-r from-[#1ABA7F]/10 via-transparent to-[#225F91]/10 p-8 text-center">
              {/* Success icon */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-green-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                  <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>

              <CardTitle className="space-y-3">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
                  {(() => {
                    const firstOrder = confirmationData.pharmacies[0]?.orders[0];
                    const userName = firstOrder?.name ? firstOrder.name.split(' ')[0] : null;
                    return userName ? `Thank You, ${userName}!` : 'Thank You!';
                  })()}
                </h1>
                <p className="text-lg text-gray-600 font-semibold">Your order has been confirmed successfully</p>
              </CardTitle>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-green-50 rounded-xl border border-green-200 w-fit mx-auto">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-800">Payment Verified & Secure</span>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Tracking Code Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Tracking Code</h3>
                    <p className="text-2xl font-black text-[#225F91] font-mono">{confirmationData.trackingCode}</p>
                  </div>

                  {isDelivery && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Estimated Delivery</h3>
                      </div>
                      <p className="text-lg font-black text-green-800">2-3 Hours</p>
                    </div>
                  )}

                  {(() => {
                    const deliveryOrder = confirmationData.pharmacies.flatMap(p => p.orders).find(o => o.deliveryMethod === 'COURIER');
                    if (deliveryOrder?.address) {
                      return (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Delivery Address</h3>
                          </div>
                          <p className="text-sm font-semibold text-gray-700">{deliveryOrder.address}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* QR Code */}
                {confirmationData.trackingCode && typeof window !== 'undefined' && (
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200/50 shadow-inner">
                    <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wide">Scan to Track</h3>
                    <div className="p-4 bg-white rounded-xl shadow-lg">
                      <QRCode
                        value={`${window.location.protocol}//${window.location.host}/track-order?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`}
                        size={180}
                        fgColor="#225F91"
                        bgColor="#ffffff"
                        qrStyle="squares"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-center">
              Order Summary
            </h2>

            {confirmationData.pharmacies.flatMap(pharmacyObj =>
              pharmacyObj.orders.map(order => {
                const pharmacy = pharmacyObj.pharmacy;
                const isPickup = order.deliveryMethod !== 'COURIER';
                return (
                  <Card key={order.id} className="bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom">
                    <CardHeader className="bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
                            <Store className="h-6 w-6 text-[#225F91]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-[#225F91]">{pharmacy.name}</h3>
                            <p className="text-sm text-gray-600 font-medium">Order #{order.id}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
                          order.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : order.status === 'PENDING'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Pickup Address */}
                      {isPickup && (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <h4 className="font-bold text-gray-700">Pickup Address</h4>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {[pharmacy.address, pharmacy.ward, pharmacy.lga, pharmacy.state]
                              .filter(Boolean)
                              .join(', ') || 'No address provided'}
                          </p>
                        </div>
                      )}

                      {/* Medications List */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="h-5 w-5 text-[#1ABA7F]" />
                          <h4 className="font-bold text-gray-700">Medications</h4>
                        </div>
                        <div className="space-y-3">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1ABA7F]/30 transition-colors duration-200">
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#1ABA7F] flex-shrink-0 mt-2" />
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {item.medication.displayName || item.medication.brandName}
                                    </p>
                                    {item.medication.ingredients?.length > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {item.medication.ingredients
                                          .map(ing => `${ing.activeSubstance || ''} ${ing.strengthValue ?? ''}${ing.strengthUnit ?? ''}`)
                                          .join(' + ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="text-sm text-gray-600 font-medium">x{item.quantity}</span>
                                <span className="text-base font-black text-[#225F91]">
                                  ₦{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-xl border-2 border-[#1ABA7F]/20">
                        <span className="text-lg font-bold text-gray-700">Order Total</span>
                        <span className="text-2xl font-black text-[#225F91]">₦{order.totalPrice.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Next Steps */}
          <Card className="bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 border-2 border-[#1ABA7F]/20 rounded-2xl shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center space-y-4">
              <h3 className="text-xl font-black text-[#225F91]">What Happens Next?</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="text-gray-700 font-medium">You'll receive an email confirmation shortly</p>
                  </div>
                </div>
                {(() => {
                  const deliveryOrder = confirmationData.pharmacies.flatMap(p => p.orders).find(o => o.deliveryMethod === 'COURIER');
                  if (deliveryOrder?.address) {
                    return (
                      <div className="p-4 bg-white rounded-xl border border-gray-200 text-left">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            2
                          </div>
                          <p className="text-gray-700 font-medium">Your medications will be delivered to your address</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {confirmationData.pharmacies.some(pharmacyObj => pharmacyObj.orders.some(order => order.deliveryMethod !== 'COURIER')) && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {(() => {
                          const deliveryOrder = confirmationData.pharmacies.flatMap(p => p.orders).find(o => o.deliveryMethod === 'COURIER');
                          return deliveryOrder?.address ? '3' : '2';
                        })()}
                      </div>
                      <p className="text-gray-700 font-medium">You'll be notified when ready for pickup</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Button
              onClick={handleTrackOrder}
              disabled={!confirmationData.trackingCode}
              className="h-14 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Track Order
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>

            <Button
              onClick={() => window.print()}
              variant="outline"
              className="h-14 border-2 border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10 font-bold rounded-xl transition-all duration-300 print:hidden"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Receipt
            </Button>

            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="h-14 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Support */}
          <div className="text-center space-y-2 print:hidden">
            <p className="text-sm text-gray-600">Having issues?</p>
            <a
              href="mailto:support@manzu.com"
              className="text-sm text-[#225F91] font-semibold underline hover:text-[#1ABA7F] transition-colors duration-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-12 print:hidden">
        <div className="text-center">
          <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Manzu. Powered by WellRica.</p>
        </div>
      </footer>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .pointer-events-none { display: none !important; }
          .bg-gradient-to-br, .backdrop-blur-sm { background: #fff !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}