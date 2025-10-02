'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Home, AlertCircle, CheckCircle, Store, MapPin, Package, FileText, Truck, Check, Clock, XCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined');
}

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
  return order.deliveryMethod === 'PICKUP' ? PICKUP_STEPS : DELIVERY_STEPS;
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
  const [expandedOrders, setExpandedOrders] = useState({});
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);

  const abortControllerRef = useRef(null);

  const toggleOrder = useCallback((orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const codeFromUrl = searchParams.get('trackingCode');
    if (codeFromUrl && codeFromUrl !== trackingCode) {
      setTrackingCode(codeFromUrl);
      if (/^TRK-[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{3}$/.test(codeFromUrl)) {
        let isMounted = true; // Add this
        
        (async () => {
          setError(null);
          setOrders([]);
          setLoading(true);
          try {
            const response = await fetch(`${API_URL || ''}/api/med-track?trackingCode=${encodeURIComponent(codeFromUrl)}`);
            if (!response.ok) {
              const errorData = await response.json();
              if (isMounted) setError(errorData.message || 'Order not found'); // Add check
              return;
            }
            const data = await response.json();
            if (isMounted) setOrders(data.orders); // Add check
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'track_order', { trackingCode: codeFromUrl });
            }
          } catch (err) {
            if (isMounted) setError('Error fetching order'); // Add check
          } finally {
            if (isMounted) setLoading(false); // Add check
          }
        })();
        
        return () => { isMounted = false; }; // Add cleanup
      }
    }
  }, [searchParams]); 

    const validateTrackingCode = (code) => {
      return /^TRK-[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{3}$/.test(code);
    };

    const handleTrack = async (e) => {
      e.preventDefault();

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (!trackingCode) {
        setError('Please enter a tracking code');
        toast.error('Please enter a tracking code', { duration: 4000 });
        return;
      }
      if (!validateTrackingCode(trackingCode)) {
        setError('Invalid tracking code format (e.g., TRK-00A7-LMK6X1-J8Q)');
        toast.error('Invalid tracking code format', { duration: 4000 });
        return;
      }
      
      try {
        setError(null);
        setOrders([]);
        setLoading(true);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/med-track?trackingCode=${encodeURIComponent(trackingCode)}`,
          { signal: abortControllerRef.current.signal } // Add signal
        );
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (jsonErr) {
            errorData = { message: 'An unexpected error occurred. Please try again.' };
          }
          
          let errorMsg = errorData.message || 'Order not found';
          if ((response.status === 404 && errorMsg === 'Orders not found or not ready for tracking') ||
              errorMsg === 'Orders not found or not ready for tracking') {
            errorMsg = 'No orders were found for this tracking code, or your order is not yet ready for tracking. Please check your code or try again later.';
          } else if (response.status === 500) {
            errorMsg = 'A server error occurred. Please try again later or contact support.';
          }
          
          setError(errorMsg);
          toast.error(errorMsg, { duration: 6000 });
          return;
        }
        
        const data = await response.json();
        setOrders(data.orders);
        toast.success('Order details found!', { duration: 6000 });
        
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'track_order', { trackingCode });
        }
      } catch (err) {
      if (err.name === 'AbortError') return; // Ignore abort errors
      setError('A network or server error occurred. Please try again later.');
      toast.error('A network or server error occurred. Please try again later.', { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };


  const handleTrackAnother = () => {
    setTrackingCode('');
    setOrders([]);
    formRef.current?.focus();
  };

  const handleBackToHome = () => router.push('/');

  if (loading && orders.length === 0) {
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
              Tracking Your Order
            </h2>
            <p className="text-gray-600 font-medium">Please wait while we fetch your order details...</p>
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
            {orders.length === 0 ? 'Track Your Order' : orders.length === 1 ? 'Order Details' : `Order Details (${orders.length} Orders)`}
          </h1>
          {orders.length > 1 && (
            <div className="space-y-2">
              <p className="text-base text-gray-700 font-medium">Multiple orders found for this tracking code</p>
              <p className="text-sm text-gray-600">Click any card to view full order details</p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Track Form */}
          {orders.length === 0 && (
            <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

              <CardHeader className="relative z-10 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-8">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
                    <Search className="h-6 w-6 text-[#225F91]" />
                  </div>
                  <CardTitle className="text-2xl font-black text-[#225F91]">
                    Enter Tracking Code
                  </CardTitle>
                </div>
                <p className="text-center text-gray-600 text-sm">
                  Track your medication delivery in real-time
                </p>
              </CardHeader>

              <CardContent className="relative z-10 p-8 space-y-6">
                <form onSubmit={handleTrack} ref={formRef} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="trackingCode" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Tracking Code
                    </Label>
                    <Input
                      id="trackingCode"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="h-14 text-base font-medium rounded-xl border-2 border-gray-300 focus:border-[#1ABA7F] focus:ring-4 focus:ring-[#1ABA7F]/20 transition-all duration-300"
                      placeholder="e.g., TRK-00A7-LMK6X1-J8Q"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your tracking code was sent to your email after checkout
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-70"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Tracking...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                          Track Order
                        </>
                      )}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
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

          {/* Error Display */}
          {error && (
            <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-2xl shadow-xl p-6 animate-in zoom-in-50 duration-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold mb-2">Order Not Found</p>
                  <p className="text-sm text-gray-600">{error}</p>
                  {typeof error === 'string' && error.includes('not yet ready for tracking') && (
                    <p className="text-sm text-gray-600 mt-2">
                      Try checking your order status with your email or phone number on the{' '}
                      <Link href="/status-check" className="text-[#225F91] underline font-semibold">Status Check</Link> page.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Orders Display */}
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
                      className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/20 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 animate-in fade-in slide-in-from-bottom"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />

                      <CardHeader
                        className={`relative z-10 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-6 space-y-6 ${isExpandable ? 'cursor-pointer' : ''}`}
                        onClick={isExpandable ? () => toggleOrder(order.id) : undefined}
                      >
                        {/* Header Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
                              <Store className="h-6 w-6 text-[#225F91]" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-[#225F91]">
                                {order.pharmacy?.name || 'Pharmacy'}
                              </h3>
                              <p className="text-sm text-gray-600 font-medium">Order #{order.id}</p>
                            </div>
                          </div>
                          {isExpandable && (
                            <div className="flex items-center gap-3">
                              {!isExpanded && (
                                <span className="text-lg font-black text-[#225F91]">
                                  ₦{order.totalPrice.toLocaleString()}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-6 w-6 text-[#225F91]" />
                              ) : (
                                <ChevronDown className="h-6 w-6 text-[#225F91]" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
                            order.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="pt-4">
                          {order.status === 'CANCELLED' ? (
                            <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                              <XCircle className="h-6 w-6 text-red-600" />
                              <span className="text-red-800 font-bold">Order Cancelled</span>
                            </div>
                          ) : order.status === 'COMPLETED' ? (
                            <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <span className="text-green-800 font-bold">Order Completed</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="flex items-center justify-between">
                                {steps.map((step, idx) => {
                                  const isCompleted = idx < currentIdx;
                                  const isCurrent = idx === currentIdx;
                                  const Icon = step.icon;

                                  return (
                                    <React.Fragment key={step.key}>
                                      <div className="flex flex-col items-center z-10 flex-1">
                                        <div className={`relative flex items-center justify-center rounded-full w-12 h-12 mb-3 transition-all duration-300 ${
                                          isCompleted 
                                            ? 'bg-gradient-to-br from-[#1ABA7F] to-green-600 shadow-lg' 
                                            : isCurrent 
                                            ? 'bg-gradient-to-br from-[#1ABA7F] to-green-600 shadow-xl ring-4 ring-[#1ABA7F]/30' 
                                            : 'bg-gray-300'
                                        }`}>
                                          {isCompleted || isCurrent ? (
                                            <Check className="h-6 w-6 text-white" strokeWidth={3} />
                                          ) : (
                                            <Icon className="h-6 w-6 text-white" />
                                          )}
                                          {isCurrent && (
                                            <div className="absolute inset-0 rounded-full bg-[#1ABA7F] animate-ping opacity-30" />
                                          )}
                                        </div>
                                        <span className={`text-xs font-bold text-center ${
                                          isCompleted || isCurrent ? 'text-[#1ABA7F]' : 'text-gray-400'
                                        }`}>
                                          {step.label}
                                        </span>
                                      </div>
                                      {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-2 mx-2 rounded-full transition-all duration-300 ${
                                          isCompleted ? 'bg-gradient-to-r from-[#1ABA7F] to-green-600' : 'bg-gray-300'
                                        }`} />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="relative z-10 p-5 sm:p-8 space-y-8">
                          {/* Order Info Grid */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {[
                              { label: 'Tracking Code', value: order.trackingCode || 'N/A' },
                              { label: 'Customer', value: order.name || order.userIdentifier || 'N/A' },
                              { label: 'Order Placed', value: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A' },
                              { label: 'Payment Status', value: order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending' }
                            ].map((item, idx) => (
                              <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                                <p className="text-sm font-bold text-gray-900">{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Address */}
                          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-5 w-5 text-blue-600" />
                              <h4 className="font-bold text-gray-700">
                                {order.deliveryMethod === 'PICKUP' ? 'Pickup Address' : 'Delivery Address'}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {order.deliveryMethod === 'PICKUP'
                                ? (order.pharmacy?.address || 'No pickup address provided')
                                : (order.address || 'No delivery address provided')}
                            </p>
                          </div>

                          {/* Medications */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Package className="h-5 w-5 text-[#1ABA7F]" />
                              <h4 className="font-bold text-gray-700 text-lg">Medications</h4>
                            </div>
                            <div className="space-y-3">
                              {order.items.map(item => (
                                <div key={item.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
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

                          {/* Prescription */}
                          {order.prescription && (
                            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200/50">
                              <div className="flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-purple-600" />
                                <h4 className="font-bold text-gray-700">Prescription Details</h4>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-bold text-gray-600">ID:</span> {order.prescription.id || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-600">Status:</span> {order.prescription.status || 'Pending'}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-600">Verified:</span> {order.prescription.verified ? 'Yes' : 'No'}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-600">Uploaded:</span>{' '}
                                  {order.prescription.createdAt ? new Date(order.prescription.createdAt).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-xl border-2 border-[#1ABA7F]/20">
                            <span className="text-lg font-bold text-gray-700">Order Total</span>
                            <span className="text-2xl font-black text-[#225F91]">₦{order.totalPrice.toLocaleString()}</span>
                          </div>

                          {/* Cancellation Notice */}
                          {order.status === 'CANCELLED' && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-red-800 mb-1">This order has been cancelled</p>
                                {order.cancelReason && (
                                  <p className="text-sm text-red-700">Reason: {order.cancelReason}</p>
                                )}
                                {order.cancelledAt && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Cancelled on: {new Date(order.cancelledAt).toLocaleString()}
                                  </p>
                                )}
                                <p className="text-sm text-gray-700 mt-2">
                                  Need help? <Link href="/support" className="text-[#225F91] underline font-semibold">Contact Support</Link>
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                  onClick={handleTrackAnother}
                  className="flex-1 h-14 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Track Another Order
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>

                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="flex-1 h-14 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-xl transition-all duration-300"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
              </div>
            </>
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