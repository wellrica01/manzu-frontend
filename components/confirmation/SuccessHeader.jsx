import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function SuccessHeader({ firstName }) {
  return (
    <Card className="relative bg-white/95 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

      <CardHeader className="relative z-10 bg-gradient-to-r from-[#1ABA7F]/10 via-transparent to-[#225F91]/10 p-6 sm:p-8 text-center">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-green-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <CardTitle className="space-y-3">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
            {firstName ? `Thank You, ${firstName}!` : 'Thank You!'}
          </h1>
          <p className="text-lg text-gray-600 font-semibold">Your order has been confirmed successfully</p>
        </CardTitle>

        <div className="flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-green-50 rounded-xl border border-green-200 w-fit mx-auto">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <span className="text-sm font-bold text-green-800">Payment Verified & Secure</span>
        </div>
      </CardHeader>
    </Card>
  );
}
