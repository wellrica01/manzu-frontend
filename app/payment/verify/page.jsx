// app/payment/verify/page.js
import { Suspense } from 'react';
import PaymentVerification from './PaymentVerification';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading payment verification...</div>}>
      <PaymentVerification />
    </Suspense>
  );
}
