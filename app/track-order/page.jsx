// /app/confirmation/page.tsx

'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import TrackOrder from '@/components/track-order/TrackOrder';

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrder />
    </Suspense>
  );
}
