import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StatusNoMedications({ prescription, onReset, onBackToHome }) {
  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-yellow-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-full" />
      
      <CardHeader className="relative z-10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-8 text-center">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <CardTitle className="space-y-2">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
            Action Required
          </h2>
          <p className="text-lg text-gray-600 font-semibold">No medications available</p>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200/50">
          <p className="text-sm text-gray-700 leading-relaxed">
            We couldn't find any medications associated with this prescription. This could mean your 
            prescription is still being processed or there may be an issue that needs attention.
          </p>
        </div>

        <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200/50">
          <h3 className="font-bold text-gray-900 mb-2">What should I do?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span>Contact our support team for assistance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span>Or start a new order if needed</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/support">Contact Support</Link>
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-lg transition-all duration-300"
          >
            Check Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}