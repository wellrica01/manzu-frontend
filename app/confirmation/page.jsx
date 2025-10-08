
'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Confirmation from '@/components/confirmation/Confirmation';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Confirmation />
    </Suspense>
  );
}
