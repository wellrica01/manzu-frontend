// /app/confirmation/page.tsx

'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import StatusCheck from './StatusClient';

export default function StatusCheckPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatusCheck />
    </Suspense>
  );
}
