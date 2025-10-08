import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ConfirmationError({ error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-8">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center space-y-2">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                Order Confirmation Failed
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200/50">
              <p className="text-red-800 text-base font-medium">{error}</p>
            </div>
            <Button
              asChild
              className="w-full h-14 bg-gradient-to-r from-[#225F91] to-[#1ABA7F] hover:from-[#1ABA7F] hover:to-[#225F91] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/status-check">Check Order Status</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
