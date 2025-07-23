'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Home, AlertCircle, CheckCircle, Store, MapPin, Package, FileText, Truck, Check, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import React from 'react'; // Added missing import for React

// Helper for progress steps
const DELIVERY_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];
const PICKUP_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Store },
];

function getOrderSteps(order) {
  if (order.deliveryMethod === 'PICKUP') return PICKUP_STEPS;
  return DELIVERY_STEPS;
}
function getOrderStepIndex(order, steps) {
  const idx = steps.findIndex(s => s.key === order.status);
  return idx >= 0 ? idx : 0;
}

export default function Track() {
  const [trackingCode, setTrackingCode] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // On mount, check for trackingCode in URL and auto-track if present
  useEffect(() => {
    const codeFromUrl = searchParams.get('trackingCode');
    if (codeFromUrl && codeFromUrl !== trackingCode) {
      setTrackingCode(codeFromUrl);
      // Only auto-track if code is valid
      if (/^TRK-SESSION-\d+-\d+$/.test(codeFromUrl)) {
        // Simulate form submit
        (async () => {
          setError(null);
          setOrders([]);
          setLoading(true);
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-track?trackingCode=${encodeURIComponent(codeFromUrl)}`);
            if (!response.ok) {
              const errorData = await response.json();
              setError(errorData.message || 'Order not found');
              setLoading(false);
              return;
            }
            const data = await response.json();
            setOrders(data.orders);
            setShowTrackDialog(true);
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'track_order', { trackingCode: codeFromUrl });
            }
          } catch (err) {
            setError('Error fetching order');
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [searchParams]);

  const validateTrackingCode = (code) => {
    return /^TRK-SESSION-\d+-\d+$/.test(code);
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingCode) {
      setError('Please enter a tracking code');
      toast.error('Please enter a tracking code', {
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
      return;
    }
    if (!validateTrackingCode(trackingCode)) {
      setError('Invalid tracking code format (e.g., TRK-SESSION-15-1747421013936)');
      toast.error('Invalid tracking code format', {
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
      return;
    }
    try {
      setError(null);
      setOrders([]);
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-track?trackingCode=${encodeURIComponent(trackingCode)}`);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonErr) {
          errorData = { message: 'An unexpected error occurred. Please try again.' };
        }
        let errorMsg = errorData.message || 'Order not found';
        if (
          (response.status === 404 && errorMsg === 'Orders not found or not ready for tracking') ||
          errorMsg === 'Orders not found or not ready for tracking'
        ) {
          errorMsg = 'No orders were found for this tracking code, or your order is not yet ready for tracking. Please check your code or try again later.';
        } else if (response.status === 500) {
          errorMsg = 'A server error occurred. Please try again later or contact support.';
        }
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 6000,
          action: {
            label: 'Retry',
            onClick: () => formRef.current?.requestSubmit(),
          },
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
        return;
      }
      const data = await response.json();
      setOrders(data.orders);
      toast.success('Order details found!', {
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
        window.gtag('event', 'track_order', { trackingCode });
      }
    } catch (err) {
      setError('A network or server error occurred. Please try again later.');
      toast.error('A network or server error occurred. Please try again later.', {
        duration: 6000,
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
    } finally {
      setLoading(false);
    }
  };

  const handleTrackAnother = () => {
    setTrackingCode('');
    setOrders([]);
    setShowTrackDialog(false);
    formRef.current?.focus();
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = (order) => {
    if (order.pharmacy && order.deliveryMethod === 'PICKUP') {
      return [{ name: order.pharmacy.name, address: order.pharmacy.address }];
    }
    return [];
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const getStatusProgress = (status) => {
    const steps = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'READY_FOR_PICKUP'];
    const index = steps.indexOf(status);
    return index >= 0 ? ((index + 1) / steps.length) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          {orders.length === 0
            ? 'Track Your Order'
            : orders.length === 1
              ? 'Order Details'
              : `Order Details (${orders.length} Orders Found)`}
        </h1>
        {orders.length > 1 && (
          <>
            <div className="text-center text-base text-gray-700 font-medium mb-2 animate-in fade-in duration-500">
              The following orders are associated with this tracking code.
            </div>
            <div className="text-center text-sm text-[#225F91] mb-6 animate-in fade-in duration-500">
              Click a card to view order details.
            </div>
          </>
        )}
        {/* Only show the form if no orders are being shown */}
        {orders.length === 0 && (
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 mb-6">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <CardHeader className="bg-[#225F91]/10 p-6 sm:p-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91]">
                Enter Tracking Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleTrack} className="space-y-6" role="form" aria-labelledby="track-form-title" ref={formRef}>
                <div>
                  <Label htmlFor="trackingCode" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                    Tracking Code
                  </Label>
                  <Input
                    id="trackingCode"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="mt-2 h-12 text-lg font-medium rounded-2xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                    placeholder="e.g., TRK-SESSION-15-1747421013936"
                    required
                    aria-required="true"
                    aria-describedby={error ? 'tracking-error' : undefined}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 px-8 text-lg font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label="Track order"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Tracking...
                    </span>
                  ) : (
                    'Track Order'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        {error && (
          <Card className="bg-white/95 border border-[#225F91]/20 rounded-2xl shadow-xl backdrop-blur-sm p-6 animate-in zoom-in-50 duration-500" id="tracking-error" role="alert">
            <p className="text-[#225F91] text-base font-medium">{error}</p>
            {typeof error === 'string' && error.includes('not yet ready for tracking') && (
              <p className="text-gray-600 text-sm mt-2">
                Try checking your order status with your email or phone number on the{' '}
                <Link href="/status-check" className="text-[#225F91] underline">Status Check</Link> page.
              </p>
            )}
          </Card>
        )}
        {/* Show order details and a Track Another Order button if orders are found */}
        {orders.length > 0 && (
          <>
            <div className="space-y-6">
              {orders.map((order, index) => {
                const steps = getOrderSteps(order);
                const currentIdx = getOrderStepIndex(order, steps);
                const isExpandable = orders.length > 1;
                const isExpanded = isExpandable ? !!expandedOrders[order.id] : true;
                return (
                  <Card
                    key={order.id}
                    className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 animate-in fade-in-20"
                    style={{ animationDelay: `${0.2 * index}s` }}
                  >
                    <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
                    <>
                      <CardHeader
                        className="bg-[#225F91]/10 p-6 sm:p-8 flex flex-col gap-2 cursor-pointer select-none"
                        onClick={isExpandable ? () => toggleOrder(order.id) : undefined}
                      >
                        <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        {order.pharmacy?.logoUrl && (
                          <img src={order.pharmacy.logoUrl} alt="Pharmacy Logo" className="h-8 w-8 rounded-full border border-gray-200 bg-white object-contain" />
                        )}
                        <span className="text-xl font-bold text-[#225F91] flex items-center gap-2">
                          <Store className="h-5 w-5 text-[#1ABA7F] mr-1" />
                          {order.pharmacy?.name || 'Pharmacy'}
                        </span>
                      </div>
                          {isExpandable && (
                            <span className="ml-2">
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-[#225F91]" /> : <ChevronDown className="h-5 w-5 text-[#225F91]" />}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 justify-between">
                        <span className="text-sm text-gray-500">Order #{order.id}</span>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-orange-100 text-orange-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}> {order.status.charAt(0).toUpperCase() + order.status.slice(1)} </span>
                          {/* Only show total price when collapsed */}
                          {isExpandable && !isExpanded && (
                            <span className="text-base font-bold text-[#225F91] ml-auto">₦{order.totalPrice.toLocaleString()}</span>
                          )}
                        </div>
                        {/* Always show the full progress bar with labels, regardless of expanded/collapsed state */}
                        <div className="w-full flex flex-col items-center mt-4">
                          {order.status === 'cancelled' ? (
                            <div className="flex items-center gap-2 text-red-600 font-semibold">
                              <XCircle className="h-5 w-5" /> Cancelled
                            </div>
                          ) : order.status === 'completed' ? (
                            <div className="flex items-center gap-2 text-[#1ABA7F] font-semibold">
                              <CheckCircle className="h-5 w-5" /> Completed
                            </div>
                          ) : (
                            <div className="flex items-center w-full justify-between gap-2">
                              {steps.map((step, idx) => {
                                const isCompleted = idx < currentIdx;
                                const isCurrent = idx === currentIdx;
                                const Icon = step.icon;
                                return (
                                  <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center z-10">
                                      <div className={`flex items-center justify-center rounded-full border-2 w-9 h-9 mb-1 transition-all duration-300
                                        ${isCompleted ? 'bg-[#1ABA7F] border-[#1ABA7F] text-white' : isCurrent ? 'bg-[#1ABA7F] border-[#1ABA7F] text-white shadow-[0_0_0_4px_rgba(26,186,127,0.15)]' : 'bg-gray-400 border-gray-400 text-white'}`}
                                      >
                                        {isCompleted || isCurrent ? (
                                          <Check className="h-5 w-5" />
                                        ) : (
                                          <Icon className="h-5 w-5" />
                                        )}
                                      </div>
                                      <span className={`text-xs font-medium text-center ${isCompleted || isCurrent ? 'text-[#1ABA7F]' : 'text-gray-400'}`}>{step.label}</span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div className={`flex-1 h-1 mx-1 mt-0.5 ${isCompleted || isCurrent ? 'bg-[#1ABA7F]' : 'bg-gray-400'}`}></div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}
                        </div>
                    </CardHeader>
                      {isExpanded && (
                    <CardContent className="p-6 sm:p-8 space-y-8">
                      {/* Order Details Grid */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#225F91] text-base font-medium">
                          <div className="flex items-center gap-2"><span className="font-semibold text-[#225F91]">Tracking Code:</span> {order.trackingCode || 'N/A'}</div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-[#225F91]">Customer:</span> {order.name || order.userIdentifier || 'N/A'}</div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-[#225F91]">Order Placed:</span> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-[#225F91]">Payment Status:</span> {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1).toLowerCase() : 'Pending'}</div>
                          {order.cancelledAt && (
                            <div className="flex items-center gap-2 col-span-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="font-semibold text-[#225F91]">Cancelled:</span> {new Date(order.cancelledAt).toLocaleString()} {order.cancelReason ? `(${order.cancelReason})` : ''}
                            </div>
                          )}
                        </div>
                        {/* Address Section */}
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <MapPin className="h-4 w-4 text-[#1ABA7F]" />
                          <span className="font-semibold text-[#225F91] mr-1">
                            {order.deliveryMethod === 'PICKUP' ? 'Pickup Address:' : 'Delivery Address:'}
                          </span>
                          <span className="text-gray-700 font-medium">
                            {order.deliveryMethod === 'PICKUP'
                              ? (order.pharmacy?.address || 'No pickup address provided')
                              : (order.address || 'No delivery address provided')}
                          </span>
                        </div>
                      </div>
                      {/* Medications Section */}
                      <div className="pt-2">
                        <div className="font-semibold text-[#225F91] mb-2 flex items-center gap-2 text-lg">
                          <Package className="h-5 w-5 text-[#1ABA7F]" />
                          Medications
                        </div>
                        <div className="space-y-2">
                          {order.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center px-2 py-1 border-b last:border-b-0">
                              <span className="flex items-center gap-2 font-medium text-gray-900">
                                <span className="w-2 h-2 rounded-full bg-[#1ABA7F] inline-block" />
                                {item.medication.displayName} {item.medication.genericName ? <span className="text-xs text-gray-500 ml-1">({item.medication.genericName})</span> : null}
                                {item.medication.prescriptionRequired && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">Prescription</span>
                                )}
                              </span>
                              <span className="text-gray-600">Qty: {item.quantity}</span>
                              <span className="text-[#225F91] font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Prescription Section */}
                      {order.prescription && (
                        <div className="pt-4">
                          <div className="font-semibold text-[#225F91] mb-2 flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-[#1ABA7F]" />
                            Prescription Details
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 text-base font-medium mt-2">
                            <div><span className="font-semibold text-gray-900">Prescription ID:</span> {order.prescription.id || 'N/A'}</div>
                            <div><span className="font-semibold text-gray-900">Status:</span> {order.prescription.status || 'Pending'}</div>
                            <div><span className="font-semibold text-gray-900">Verified:</span> {order.prescription.verified ? 'Yes' : 'No'}</div>
                            <div><span className="font-semibold text-gray-900">Uploaded:</span> {order.prescription.createdAt ? new Date(order.prescription.createdAt).toLocaleString() : 'N/A'}</div>
                          </div>
                          {order.prescription.medications?.length > 0 && (
                            <div className="mt-2">
                              <span className="font-semibold text-gray-900 text-base font-medium">Prescribed Medications:</span>
                              <div className="mt-1 space-y-1">
                                {order.prescription.medications.map((med, index) => (
                                  <div key={index} className="flex items-center gap-2 text-gray-600 text-base">
                                    <span className="w-2 h-2 rounded-full bg-[#1ABA7F] inline-block" />
                                    {med.displayName} {med.genericName ? <span className="text-xs text-gray-500 ml-1">({med.genericName})</span> : null} - Dosage: {med.dosage || 'N/A'}, Quantity: {med.quantity || 'N/A'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Order Total */}
                      <div className="flex justify-end mt-6 text-2xl font-bold text-[#225F91] border-t pt-6">Total: ₦{order.totalPrice.toLocaleString()}</div>
                      {/* Cancelled Notice */}
                      {order.status === 'CANCELLED ' && (
                        <div className="mt-4 flex items-center gap-2 text-[#225F91]">
                          <AlertCircle className="h-5 w-5" />
                          <p className="text-base font-medium">
                            This order was cancelled. Contact <Link href="/support" className="text-[#225F91] underline">support</Link> for assistance.
                          </p>
                        </div>
                      )}
                    </CardContent>
                      )}
                    </>
                  </Card>
                );
              })}
            </div>
            <Button
              onClick={handleTrackAnother}
              className="w-full h-14 px-8 text-lg font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300 mt-8"
              aria-label="Track another order"
            >
              Track Another Order
            </Button>
          </>
        )}
      </div>
    </div>
  );
}