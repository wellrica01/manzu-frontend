import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderError({ error }) {
  const showStatusCheckLink = error && typeof error === 'string' && error.includes('not yet ready for tracking');

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-lg shadow-xl p-6 animate-in zoom-in-50 duration-500">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-red-800 font-semibold mb-2">Order Not Found</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    </Card>
  );
}