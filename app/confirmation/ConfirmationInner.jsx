'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, Store, Package, FileText, CheckCircle, Mail, HelpCircle, Printer, MapPin, ChevronDown, ChevronUp, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Confetti from 'react-dom-confetti';

export default function ConfirmationInner() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');

  // Collapsible order details state
  const [expandedOrders, setExpandedOrders] = useState({});
  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

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

  // Show confetti when confirmation is successful
  useEffect(() => {
    if (!loading && !error) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [loading, error]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleTrackOrder = () => {
    if (confirmationData.trackingCode) {
      router.push(`/track-order?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
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
      <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80">
        <Loader2 className="h-10 w-10 text-[#225F91] animate-spin" />
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="bg-white/95 border border-[#225F91]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 animate-in zoom-in-50 duration-500">
            <p className="text-[#225F91] text-base font-medium">{error}</p>
            <Button
              asChild
              variant="outline"
              className="mt-4 h-10 px-4 rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
            >
              <Link href="/status-check">Check Status</Link>
            </Button>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // Delivery method check (update all occurrences)
  const isDelivery = confirmationData.pharmacies.some(pharmacy => pharmacy.orders.some(order => order.deliveryMethod === 'COURIER'));

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      {/* Confetti animation on success */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none">
        <Confetti active={showConfetti} />
      </div>
      <div className="container mx-auto max-w-5xl">
        <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30">
          <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
          <CardHeader className="bg-[#225F91]/10 p-8 text-center flex flex-col items-center">
            <CheckCircle className={`h-10 w-10 text-[#1ABA7F] mb-2 transition-all ${showConfetti ? 'animate-pulse-check' : ''}`} />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] mb-1">
              {(() => {
                const firstOrder = confirmationData.pharmacies[0]?.orders[0];
                const userName = firstOrder?.name ? firstOrder.name.split(' ')[0] : null;
                return userName ? `Thank you, ${userName}!` : 'Thank You!';
              })()}
            </CardTitle>
            <div className="text-lg text-[#225F91] font-medium">Your order is confirmed.</div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Order summary section */}
            <div className="space-y-2 text-base text-gray-700">
              <div className="flex flex-wrap gap-6 items-center justify-center">
                <span><strong>Tracking Code:</strong> {confirmationData.trackingCode}</span>
                {confirmationData.pharmacies.some(pharmacy => pharmacy.orders.some(order => order.deliveryMethod === 'COURIER')) && (
                  <span className="text-green-700"><strong>Estimated delivery:</strong> 2-3 hours</span>
                )}
                {/* Show delivery address if any delivery order exists */}
                {(() => {
                  const deliveryOrder = confirmationData.pharmacies.flatMap(p => p.orders).find(o => o.deliveryMethod === 'COURIER');
                  if (deliveryOrder && deliveryOrder.address) {
                    return (
                      <span className="flex items-center gap-2 text-[#225F91]">
                        <MapPin className="h-4 w-4" />
                        <span><strong>Delivery Address:</strong> {deliveryOrder.address}</span>
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
              <h3 className="text-lg font-semibold text-[#225F91] mb-4">Order Summary</h3>
            <div className="space-y-8">
              {confirmationData.pharmacies.flatMap(pharmacyObj =>
                pharmacyObj.orders.map(order => {
                  const pharmacy = pharmacyObj.pharmacy;
                  const isPickup = order.deliveryMethod !== 'COURIER';
                  return (
                    <Card key={order.id} className="border border-[#1ABA7F]/20 rounded-2xl shadow-xl bg-white/95 overflow-hidden">
                      <CardHeader className="bg-[#225F91]/10 p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          {pharmacy.logoUrl && (
                            <img src={pharmacy.logoUrl} alt="Pharmacy Logo" className="h-8 w-8 rounded-full border border-gray-200 bg-white object-contain" />
                          )}
                          <span className="text-xl font-bold text-[#225F91] flex items-center gap-2">
                            <Store className="h-5 w-5 text-[#1ABA7F] mr-1" />
                            {pharmacy.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">Order #{order.id}</span>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Pickup Address (if pickup) */}
                        {isPickup && (
                          <div>
                            <div className="font-semibold text-[#225F91] mb-1">Pickup Address:</div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-[#1ABA7F]" />
                              <span>{[
                                pharmacy.address,
                                pharmacy.ward,
                                pharmacy.lga,
                                pharmacy.state
                              ].filter(Boolean).join(', ') || 'No address provided'}</span>
                            </div>
                          </div>
                        )}
                        {/* Medications */}
                        <div>
                          <div className="font-semibold text-[#225F91] mb-1 flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#1ABA7F]" />
                            Medications:
                          </div>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.id} className="flex justify-between items-center px-2 py-1 border-b last:border-b-0">
                                <span className="flex items-center gap-2 font-medium text-gray-900">
                                  <span className="w-2 h-2 rounded-full bg-[#1ABA7F] inline-block" />
                                  {item.medication.displayName || item.medication.genericName}
                                </span>
                                <span className="text-gray-600">Qty: {item.quantity}</span>
                                <span className="text-[#225F91] font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Order Total */}
                        <div className="flex justify-end mt-2 text-base font-bold text-[#225F91]">Order Total: ₦{order.totalPrice.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            </CardContent>
          </Card>
            {/* Smart, merged next steps section */}
            <div className="bg-[#1ABA7F]/10 border border-[#1ABA7F]/20 rounded-xl p-4 text-[#225F91] text-center text-base mt-8">
              <div className="mb-3 font-medium">Here’s what happens next:</div>
              <div className="flex flex-col gap-3 items-center justify-center">
                {/* Email confirmation message (once) */}
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-[#1ABA7F]" />
                        <span className="text-sm">You’ll get an email confirmation</span>
                      </div>
                {/* Delivery message (once, if any delivery order) */}
                {(() => {
                  const deliveryOrder = confirmationData.pharmacies.flatMap(p => p.orders).find(o => o.deliveryMethod === 'COURIER');
                  if (deliveryOrder && deliveryOrder.address) {
                    return (
                      <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#1ABA7F]" />
                        <span className="text-sm">Your medications will be delivered soon to <span className="font-semibold">{deliveryOrder.address}</span></span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Pickup messages (one per pickup pharmacy) */}
                {confirmationData.pharmacies.some(pharmacyObj => pharmacyObj.orders.some(order => order.deliveryMethod !== 'COURIER')) && (
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#1ABA7F]" />
                    <span className="text-sm">You’ll be notified when your medications are ready for pickup at your selected pharmacy.</span>
                  </div>
                )}
                {/* Support message (once) */}
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-[#1ABA7F]" />
                        <span className="text-sm">Contact support if you have questions</span>
                      </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                onClick={handleTrackOrder}
                className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300"
                disabled={!confirmationData.trackingCode}
                aria-label="Track your order with tracking code"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Track Order
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="h-12 px-6 text-base font-semibold rounded-full border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10 hover:shadow-lg transition-all duration-300 print:hidden"
                aria-label="Print or download your receipt"
              >
                <Printer className="h-5 w-5 mr-2" />
                Print Receipt
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
                aria-label="Go back to home page"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
        </div>
      </div>
      {/* Support link section */}
      <div className="w-full flex flex-col items-center mt-10">
        <span className="text-sm text-gray-500 mb-1">Having issues?</span>
        <a
          href="mailto:support@manzu.com"
          className="text-sm text-[#225F91] underline hover:text-[#1ABA7F] focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded"
          aria-label="Contact support via email"
          tabIndex={0}
        >
          Contact support
        </a>
      </div>
      {/* Platform Tagline and Footer */}
      <div className="w-full flex flex-col items-center mt-12 mb-4 print:hidden">
        <img src="/logo_1.png" alt="Manzu Logo" className="h-8 mb-2" />
        <div className="text-sm text-[#225F91] font-semibold mb-1">
          Manzu: Your trusted platform for medications across Nigeria.
        </div>
        <div className="text-xs text-gray-400">
          © {new Date().getFullYear()} Manzu. Powered by WellRica.
        </div>
      </div>
      {/* Print styles: hide confetti and support link when printing */}
      <style jsx global>{`
        @media print {
          .print\:hidden { display: none !important; }
          .pointer-events-none { display: none !important; }
          .bg-gradient-to-b, .backdrop-blur-sm { background: #fff !important; box-shadow: none !important; }
        }
      `}</style>
      {/* Custom slow spin for Loader2 icon in checklist */}
      <style jsx global>{`
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
      `}</style>
      {/* Checkmark pulse animation for success */}
      <style jsx global>{`
        @keyframes pulse-check {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 #1ABA7F); }
          50% { transform: scale(1.2); filter: drop-shadow(0 0 8px #1ABA7F); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 #1ABA7F); }
        }
        .animate-pulse-check {
          animation: pulse-check 1s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </>
  );
}