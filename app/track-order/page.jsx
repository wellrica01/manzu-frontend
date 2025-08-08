// /app/confirmation/page.tsx

'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Track from './TrackOrderClient';

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Track />
    </Suspense>
  );
}
