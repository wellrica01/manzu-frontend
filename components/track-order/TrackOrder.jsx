'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

// Hooks
import { useTrackOrder } from '@/hooks/useTrackOrder';
import { useExpandedOrders } from '@/hooks/useExpandedOrders';

// Components
import TrackOrderForm from './TrackOrderForm';
import TrackOrderLoading from './TrackOrderLoading';
import TrackOrderError from './TrackOrderError';
import OrderCard from './OrderCard';

export default function TrackOrder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [trackingCode, setTrackingCode] = useState('');
  const { expandedOrders, toggleOrder } = useExpandedOrders();
  const hasAutoTrackedRef = useRef(false);
  
  // Track order mutation
  const {
    mutate: trackOrder,
    data: orders,
    isPending,
    isError,
    error,
    reset
  } = useTrackOrder();

// Auto-track if tracking code is in URL (only once)
useEffect(() => {
  const codeFromUrl = searchParams.get('trackingCode');
  if (codeFromUrl && !hasAutoTrackedRef.current) {
    setTrackingCode(codeFromUrl);
    if (/^TRK-[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{3}$/.test(codeFromUrl)) {
      trackOrder(codeFromUrl);
      hasAutoTrackedRef.current = true;
    }
  }
}, [searchParams, trackOrder]);

  const handleSubmit = (code) => {
    setTrackingCode(code);
    trackOrder(code);
    // Update URL with the new tracking code
    router.replace(`/track-order?trackingCode=${encodeURIComponent(code)}`);
  };

  const handleTrackAnother = () => {
    setTrackingCode('');
    reset();
    hasAutoTrackedRef.current = false;
    // Remove tracking code from URL
    router.replace('/track-order');
  };

  const handleBackToHome = () => router.push('/');

  // Loading state
  if (isPending && !orders) {
    return <TrackOrderLoading />;
  }

  const hasOrders = orders && orders.length > 0;
  const orderCount = orders?.length || 0;

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
            {!hasOrders ? 'Track Your Order' : orderCount === 1 ? 'Order Details' : `Order Details (${orderCount} Orders)`}
          </h1>
          {orderCount > 1 && (
            <div className="space-y-2">
              <p className="text-base text-gray-700 font-medium">Multiple orders found for this tracking code</p>
              <p className="text-sm text-gray-600">Click any card to view full order details</p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Track Form */}
          {!hasOrders && (
            <TrackOrderForm
              trackingCode={trackingCode}
              onTrackingCodeChange={setTrackingCode}
              onSubmit={handleSubmit}
              onBackToHome={handleBackToHome}
              isLoading={isPending}
            />
          )}

          {/* Error Display */}
          {isError && !hasOrders && (
            <TrackOrderError error={error?.message || 'An error occurred'} />
          )}

          {/* Orders Display */}
          {hasOrders && (
            <>
              <div className="space-y-6">
                {orders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    isExpandable={orderCount > 1}
                    isExpanded={orderCount > 1 ? expandedOrders[order.id] : true}
                    onToggle={() => toggleOrder(order.id)}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                  onClick={handleTrackAnother}
                  className="flex-1 h-12 p-4 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
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
                  className="flex-1 h-12 p-3 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-lg transition-all duration-300"
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