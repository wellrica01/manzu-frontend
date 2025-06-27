'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const OrderStatusBanner = ({ hasPending, hasRejected, hasVerified, onReupload }) => {
  if (hasRejected) {
    return (
      <div className="bg-red-100 p-4 rounded-xl mb-6 text-red-600 text-center flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>Some prescriptions were rejected. Please re-upload for affected items.</span>
        <Button
          className="h-8 px-4 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
          onClick={onReupload}
          aria-label="Re-upload prescriptions"
        >
          Re-upload
        </Button>
      </div>
    );
  }

  if (hasPending) {
    return (
      <div className="bg-[#1ABA7F]/10 p-4 rounded-xl mb-6 text-[#225F91] text-center flex items-center justify-center gap-2">
        <Clock className="h-5 w-5" />
        <span>Waiting for prescription verification. You'll be notified within 1-2 hours.</span>
      </div>
    );
  }

  if (hasVerified && !hasPending && !hasRejected) {
    return (
      <div className="bg-[#1ABA7F]/10 p-4 rounded-xl mb-6 text-[#225F91] text-center flex items-center justify-center gap-2">
        <CheckCircle className="h-5 w-5" />
        <span>Your prescription is verified! Proceed to checkout.</span>
      </div>
    );
  }

  return null;
};

export default OrderStatusBanner;