// /app/confirmation/page.tsx

'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ConfirmationInner from './ConfirmationInner';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationInner />
    </Suspense>
  );
}
