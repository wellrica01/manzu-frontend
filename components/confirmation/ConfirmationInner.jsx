'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  MapPin, 
  Printer, 
} from 'lucide-react';
import Confetti from 'react-dom-confetti';

// Hooks
import { useConfirmationData } from '@/hooks/useConfirmationData';
import { useConfetti } from '@/hooks/useConfetti';
import { useGuestId } from '@/hooks/useGuestId';

// Components
import ConfirmationLoading from './ConfirmationLoading';
import ConfirmationError from './ConfirmationError';
import SuccessHeader from './SuccessHeader';
import TrackingSection from './TrackingSection';
import OrderSummaryCard from './OrderSummaryCard';
import NextStepsCard from './NextStepsCard';

// Constants
const CONFETTI_CONFIG = {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = useGuestId();
  
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');
  
  // Fetch confirmation data
  const { 
    data: confirmationData, 
    isLoading, 
    error 
  } = useConfirmationData(guestId, session, reference);
  
  // Confetti effect
  const { showConfetti, triggerConfetti } = useConfetti();

  // Trigger confetti on success
  useEffect(() => {
    if (!isLoading && !error && confirmationData) {
      triggerConfetti();
    }
  }, [isLoading, error, confirmationData, triggerConfetti]);

  // Handlers
  const handleBackToHome = () => router.push('/');
  
  const handleTrackOrder = () => {
    if (confirmationData?.trackingCode) {
      router.push(`/track-order?trackingCode=${encodeURIComponent(confirmationData.trackingCode)}`);
    }
  };

  const handlePrint = () => window.print();

  // Loading state
  if (isLoading) {
    return <ConfirmationLoading />;
  }

  // Error state
  if (error) {
    return <ConfirmationError error={error} />;
  }

  // No data
  if (!confirmationData) {
    return <ConfirmationError error="No confirmation data available" />;
  }

  const isDelivery = confirmationData.pharmacies.some(
    pharmacy => pharmacy.orders.some(order => order.deliveryMethod === 'COURIER')
  );

  const deliveryOrder = confirmationData.pharmacies
    .flatMap(p => p.orders)
    .find(o => o.deliveryMethod === 'COURIER');

  const hasPickupOrders = confirmationData.pharmacies.some(
    pharmacyObj => pharmacyObj.orders.some(order => order.deliveryMethod !== 'COURIER')
  );

  const firstName = confirmationData.pharmacies[0]?.orders[0]?.name?.split(' ')[0];

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
        <Confetti active={showConfetti} config={CONFETTI_CONFIG} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 px-4">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <SuccessHeader firstName={firstName} />

          {/* Tracking Section */}
          <TrackingSection
            trackingCode={confirmationData.trackingCode}
            isDelivery={isDelivery}
            deliveryAddress={deliveryOrder?.address}
          />

          {/* Order Summary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-center">
              Order Summary
            </h2>

            {confirmationData.pharmacies.flatMap(pharmacyObj =>
              pharmacyObj.orders.map(order => (
                <OrderSummaryCard
                  key={order.id}
                  order={order}
                  pharmacy={pharmacyObj.pharmacy}
                />
              ))
            )}
          </div>

          {/* Next Steps */}
          <NextStepsCard
            hasDelivery={!!deliveryOrder?.address}
            hasPickup={hasPickupOrders}
          />

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
              onClick={handlePrint}
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