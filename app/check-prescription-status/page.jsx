// /app/confirmation/page.tsx

'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import StatusCheck from '../../components/check-prescription-status/StatusCheck';

export default function StatusCheckPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatusCheck />
    </Suspense>
  );
}
